'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/session';

export type ActionResult = { ok: true } | { ok: false; error: string };
export type CreateTypeResult = { ok: true; id: string } | { ok: false; error: string };

const DAY_MS = 24 * 60 * 60 * 1000;

function canManage(role: string) {
  return role === 'ADMINISTRATEUR' || role === 'CHEF_ARMEMENT';
}

type CertStatus = 'OK' | 'BIENTOT' | 'EXPIRE';

function certificateStatus(expiresAt: Date | null, alert1: number, alert2: number, alert3: number): CertStatus | null {
  if (!expiresAt) return null;
  const remainingDays = (expiresAt.getTime() - Date.now()) / DAY_MS;
  if (remainingDays <= 0) return 'EXPIRE';
  if (remainingDays <= alert1 || remainingDays <= alert2 || remainingDays <= alert3) return 'BIENTOT';
  return 'OK';
}

type DisplayStatus = 'PREVU' | 'A_VENIR' | 'REALISE' | 'EN_RETARD' | 'ANNULE';

function exerciseDisplayStatus(entry: { status: string; plannedAt: Date | null; execution: unknown }): DisplayStatus {
  if (entry.execution) return 'REALISE';
  if (entry.status === 'ANNULE') return 'ANNULE';
  if (entry.plannedAt) {
    const remainingDays = (entry.plannedAt.getTime() - Date.now()) / DAY_MS;
    if (remainingDays <= 0) return 'EN_RETARD';
    if (remainingDays <= 30) return 'A_VENIR';
  }
  return 'PREVU';
}

export async function getComplianceOverview(tugId: string, year: number) {
  const actor = await requireUser();

  const [tug, company, certificates, certificateTypes, exerciseTypes, captains, entries] = await Promise.all([
    prisma.tug.findUniqueOrThrow({ where: { id: tugId } }),
    prisma.company.findUniqueOrThrow({ where: { id: actor.companyId } }),
    prisma.certificate.findMany({ where: { tugId }, include: { type: true }, orderBy: { expiresAt: 'asc' } }),
    prisma.certificateType.findMany({ where: { companyId: actor.companyId, isArchived: false }, orderBy: { name: 'asc' } }),
    prisma.exerciseType.findMany({ where: { companyId: actor.companyId, isArchived: false }, orderBy: { name: 'asc' } }),
    prisma.user.findMany({ where: { companyId: actor.companyId, role: 'CAPITAINE', status: 'ACTIF' }, orderBy: { lastName: 'asc' } }),
    prisma.exerciseProgramEntry.findMany({
      where: { tugId, year },
      include: { type: true, captain: true, execution: true },
      orderBy: [{ typeId: 'asc' }, { captainId: 'asc' }],
    }),
  ]);

  const certificatesWithStatus = certificates.map((c) => ({
    ...c,
    status: certificateStatus(c.expiresAt, company.certificateDaysAlert1, company.certificateDaysAlert2, company.certificateDaysAlert3),
  }));

  const entriesWithStatus = entries.map((e) => ({ ...e, displayStatus: exerciseDisplayStatus(e) }));

  const gridTypes = [...new Map(entriesWithStatus.map((e) => [e.typeId, e.type])).values()];
  const gridCaptains = [...new Map(entriesWithStatus.map((e) => [e.captainId, e.captain])).values()];

  const myPendingEntries =
    actor.role === 'CAPITAINE'
      ? entriesWithStatus.filter((e) => e.captainId === actor.id && e.displayStatus !== 'REALISE' && e.displayStatus !== 'ANNULE')
      : [];

  return {
    tug,
    year,
    certificates: certificatesWithStatus,
    certificateTypes,
    exerciseTypes,
    captains,
    entries: entriesWithStatus,
    gridTypes,
    gridCaptains,
    myPendingEntries,
    canManage: canManage(actor.role),
    isCaptain: actor.role === 'CAPITAINE',
  };
}

export async function createCertificateType(name: string): Promise<CreateTypeResult> {
  const actor = await requireUser();
  if (!canManage(actor.role)) return { ok: false, error: 'Réservé à l\'administrateur et au chef d\'armement.' };
  if (!name.trim()) return { ok: false, error: 'Nom requis.' };
  const type = await prisma.certificateType.create({ data: { companyId: actor.companyId, name } });
  return { ok: true, id: type.id };
}

export async function createExerciseType(name: string): Promise<CreateTypeResult> {
  const actor = await requireUser();
  if (!canManage(actor.role)) return { ok: false, error: 'Réservé à l\'administrateur et au chef d\'armement.' };
  if (!name.trim()) return { ok: false, error: 'Nom requis.' };
  const type = await prisma.exerciseType.create({ data: { companyId: actor.companyId, name } });
  return { ok: true, id: type.id };
}

export async function createCertificate(input: {
  tugId: string;
  typeId: string;
  referenceNumber?: string;
  issuedAt?: string;
  expiresAt?: string;
  authority?: string;
  remarks?: string;
}): Promise<ActionResult> {
  const actor = await requireUser();
  if (!canManage(actor.role)) return { ok: false, error: 'Réservé à l\'administrateur et au chef d\'armement.' };
  if (!input.typeId) return { ok: false, error: 'Type requis.' };

  await prisma.certificate.create({
    data: {
      tugId: input.tugId,
      typeId: input.typeId,
      referenceNumber: input.referenceNumber || null,
      issuedAt: input.issuedAt ? new Date(input.issuedAt) : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      authority: input.authority || null,
      remarks: input.remarks || null,
    },
  });

  revalidatePath(`/flotte/${input.tugId}/certificats-exercices`);
  return { ok: true };
}

export async function generateExerciseProgram(input: {
  tugId: string;
  year: number;
  captainIds: string[];
  typeIds: string[];
}): Promise<ActionResult> {
  const actor = await requireUser();
  if (!canManage(actor.role)) return { ok: false, error: 'Réservé à l\'administrateur et au chef d\'armement.' };
  if (input.captainIds.length === 0 || input.typeIds.length === 0) {
    return { ok: false, error: 'Sélectionnez au moins un capitaine et un type d\'exercice.' };
  }

  const existing = await prisma.exerciseProgramEntry.findMany({
    where: { tugId: input.tugId, year: input.year, captainId: { in: input.captainIds }, typeId: { in: input.typeIds } },
    select: { captainId: true, typeId: true },
  });
  const existingKeys = new Set(existing.map((e) => `${e.captainId}:${e.typeId}`));

  const toCreate = [];
  for (const captainId of input.captainIds) {
    for (const typeId of input.typeIds) {
      if (!existingKeys.has(`${captainId}:${typeId}`)) {
        toCreate.push({ tugId: input.tugId, year: input.year, captainId, typeId });
      }
    }
  }

  if (toCreate.length > 0) {
    await prisma.exerciseProgramEntry.createMany({ data: toCreate });
  }

  revalidatePath(`/flotte/${input.tugId}/certificats-exercices`);
  return { ok: true };
}

export async function recordExerciseExecution(input: {
  programEntryId: string;
  actualDate: string;
  participants?: string;
  result?: string;
  observations?: string;
  correctiveActions?: string;
}): Promise<ActionResult> {
  const actor = await requireUser();
  if (actor.role !== 'CAPITAINE') return { ok: false, error: 'Réservé au capitaine.' };

  const entry = await prisma.exerciseProgramEntry.findUnique({ where: { id: input.programEntryId } });
  if (!entry) return { ok: false, error: 'Exercice introuvable.' };
  if (entry.captainId !== actor.id) return { ok: false, error: "Cet exercice n'est pas le vôtre." };

  await prisma.$transaction([
    prisma.exerciseExecution.create({
      data: {
        programEntryId: entry.id,
        executedById: actor.id,
        actualDate: new Date(input.actualDate),
        participants: input.participants || null,
        result: input.result || null,
        observations: input.observations || null,
        correctiveActions: input.correctiveActions || null,
      },
    }),
    prisma.exerciseProgramEntry.update({ where: { id: entry.id }, data: { status: 'REALISE' } }),
  ]);

  revalidatePath(`/flotte/${entry.tugId}/certificats-exercices`);
  return { ok: true };
}
