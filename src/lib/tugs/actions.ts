'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireRole, requireUser } from '@/lib/auth/session';
import type { TugOperationalStatus } from '@prisma/client';

export type ActionResult = { ok: true } | { ok: false; error: string };

const STATUS_MANAGERS = ['ADMINISTRATEUR', 'CHEF_ARMEMENT', 'CHEF_MECANICIEN'] as const;

export async function listTugs() {
  const actor = await requireUser();
  return prisma.tug.findMany({
    where: { companyId: actor.companyId, isArchived: false },
    orderBy: { name: 'asc' },
    include: { tugType: true },
  });
}

export async function listTugTypes() {
  const actor = await requireUser();
  return prisma.tugType.findMany({
    where: { companyId: actor.companyId, isArchived: false },
    orderBy: { name: 'asc' },
  });
}

export async function getTug(id: string) {
  const actor = await requireUser();
  const tug = await prisma.tug.findUnique({ where: { id }, include: { tugType: true } });
  if (!tug || tug.companyId !== actor.companyId) return null;

  const statusHistory = await prisma.tugStatusHistory.findMany({
    where: { tugId: id },
    include: { changedBy: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return { tug, statusHistory };
}

export async function createTug(input: {
  name: string;
  tugTypeId: string;
  internalCode?: string;
}): Promise<ActionResult> {
  const actor = await requireRole('ADMINISTRATEUR', 'CHEF_ARMEMENT');
  if (!input.name.trim()) return { ok: false, error: 'Le nom est obligatoire.' };
  if (!input.tugTypeId) return { ok: false, error: 'Le type de remorqueur est obligatoire.' };

  const tug = await prisma.tug.create({
    data: {
      companyId: actor.companyId,
      name: input.name.trim(),
      tugTypeId: input.tugTypeId,
      internalCode: input.internalCode?.trim() || undefined,
    },
  });

  await prisma.tugStatusHistory.create({
    data: { tugId: tug.id, status: 'DISPONIBLE', changedById: actor.id, reason: 'Création de la fiche' },
  });

  revalidatePath('/flotte');
  return { ok: true };
}

type TugSpecsInput = {
  imo?: string;
  callSign?: string;
  flag?: string;
  yearBuilt?: number;
  shipyard?: string;
  lengthM?: number;
  widthM?: number;
  draftM?: number;
  tonnageGT?: number;
  bollardPullT?: number;
  speedKnots?: number;
  propulsionType?: string;
  fuelCapacityT?: number;
  oilCapacityL?: number;
  fireFightingEquipment?: string;
  towingEquipment?: string;
  winch?: string;
};

export async function updateTugSpecs(id: string, input: TugSpecsInput): Promise<ActionResult> {
  const actor = await requireRole('ADMINISTRATEUR', 'CHEF_ARMEMENT');
  const existing = await prisma.tug.findUnique({ where: { id } });
  if (!existing || existing.companyId !== actor.companyId) return { ok: false, error: 'Introuvable.' };

  await prisma.tug.update({ where: { id }, data: input });
  revalidatePath(`/flotte/${id}`);
  return { ok: true };
}

export async function changeTugStatus(
  id: string,
  input: {
    status: TugOperationalStatus;
    reason?: string;
    temporaryActivationStart?: string;
    temporaryActivationEnd?: string;
  }
): Promise<ActionResult> {
  const actor = await requireRole(...STATUS_MANAGERS);
  const existing = await prisma.tug.findUnique({ where: { id } });
  if (!existing || existing.companyId !== actor.companyId) return { ok: false, error: 'Introuvable.' };
  if (input.status === 'OCCUPE') {
    return { ok: false, error: "Le statut \"Occupé\" est piloté automatiquement par les missions." };
  }
  if (input.status === 'ACTIVE_TEMPORAIREMENT' && (!input.temporaryActivationStart || !input.temporaryActivationEnd)) {
    return { ok: false, error: 'Une activation temporaire exige une période de début et de fin.' };
  }

  await prisma.$transaction([
    prisma.tug.update({ where: { id }, data: { status: input.status } }),
    prisma.tugStatusHistory.create({
      data: {
        tugId: id,
        status: input.status,
        changedById: actor.id,
        reason: input.reason || null,
        temporaryActivationStart: input.temporaryActivationStart
          ? new Date(input.temporaryActivationStart)
          : null,
        temporaryActivationEnd: input.temporaryActivationEnd
          ? new Date(input.temporaryActivationEnd)
          : null,
      },
    }),
  ]);

  revalidatePath(`/flotte/${id}`);
  revalidatePath('/flotte');
  return { ok: true };
}

export async function archiveTug(id: string): Promise<ActionResult> {
  const actor = await requireRole('ADMINISTRATEUR', 'CHEF_ARMEMENT');
  const existing = await prisma.tug.findUnique({ where: { id } });
  if (!existing || existing.companyId !== actor.companyId) return { ok: false, error: 'Introuvable.' };

  await prisma.tug.update({ where: { id }, data: { isArchived: true } });
  revalidatePath('/flotte');
  return { ok: true };
}
