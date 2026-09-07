'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/session';
import type { HandoverKind } from '@prisma/client';

export type ActionResult = { ok: true } | { ok: false; error: string };

function kindForRole(role: string): HandoverKind | null {
  if (role === 'CAPITAINE') return 'CAPITAINE';
  if (role === 'CHEF_MECANICIEN') return 'CHEF_MECANICIEN';
  return null;
}

function posteNameForKind(kind: HandoverKind) {
  return kind === 'CAPITAINE' ? 'Capitaine' : 'Chef mécanicien';
}

/**
 * Contexte de fin de service pour le tableau de bord : le service en cours,
 * si l'utilisateur y tient une affectation active, les moteurs du remorqueur
 * (pour la déclaration Chef mécanicien) et la dernière déclaration du même
 * type reçue d'une personne différente (à contester le cas échéant).
 */
export async function getHandoverContext(tugId: string) {
  const actor = await requireUser();
  const kind = kindForRole(actor.role);
  if (!kind) return { kind: null, hasOpenAssignment: false, engines: [], lastDeclaration: null };

  const service = await prisma.service.findFirst({ where: { tugId, actualEnd: null } });
  const poste = await prisma.poste.findFirst({
    where: { companyId: actor.companyId, name: posteNameForKind(kind) },
  });

  const hasOpenAssignment =
    !!service && !!poste
      ? !!(await prisma.postAssignment.findFirst({
          where: { serviceId: service.id, userId: actor.id, posteId: poste.id, endsAt: null },
        }))
      : false;

  const engines =
    kind === 'CHEF_MECANICIEN' ? await prisma.engine.findMany({ where: { tugId }, orderBy: [{ kind: 'asc' }, { label: 'asc' }] }) : [];

  const lastDeclaration = await prisma.handoverDeclaration.findFirst({
    where: { kind, service: { tugId }, userId: { not: actor.id } },
    orderBy: { createdAt: 'desc' },
    include: { user: true, contestations: { orderBy: { createdAt: 'desc' } } },
  });

  return { kind, hasOpenAssignment, engines, lastDeclaration };
}

/**
 * Déclaration de relève + clôture de l'affectation de poste de l'auteur.
 * Le service se termine (actualEnd) quand plus aucune affectation Capitaine
 * ou Chef mécanicien n'est ouverte — les deux rôles sont indépendants.
 */
export async function submitHandover(input: {
  tugId: string;
  fuelRemainingT?: number;
  oilRemainingL?: number;
  engineHourReadings?: { engineId: string; hours: number }[];
  technicalState?: string;
  remarks?: string;
}): Promise<ActionResult> {
  const actor = await requireUser();
  const kind = kindForRole(actor.role);
  if (!kind) return { ok: false, error: 'Seuls le capitaine et le chef mécanicien déclarent une relève.' };

  const service = await prisma.service.findFirst({ where: { tugId: input.tugId, actualEnd: null } });
  if (!service) return { ok: false, error: 'Aucun service en cours sur ce remorqueur.' };

  const poste = await prisma.poste.findFirst({
    where: { companyId: actor.companyId, name: posteNameForKind(kind) },
  });
  if (!poste) return { ok: false, error: 'Poste introuvable.' };

  const assignment = await prisma.postAssignment.findFirst({
    where: { serviceId: service.id, userId: actor.id, posteId: poste.id, endsAt: null },
  });
  if (!assignment) return { ok: false, error: "Vous n'êtes pas en service actif sur ce remorqueur." };

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.handoverDeclaration.create({
      data: {
        serviceId: service.id,
        userId: actor.id,
        kind,
        fuelRemainingT: kind === 'CHEF_MECANICIEN' ? input.fuelRemainingT : undefined,
        oilRemainingL: kind === 'CHEF_MECANICIEN' ? input.oilRemainingL : undefined,
        engineHourReadings: kind === 'CHEF_MECANICIEN' ? (input.engineHourReadings ?? []) : undefined,
        technicalState: kind === 'CHEF_MECANICIEN' ? input.technicalState || null : null,
        remarks: input.remarks || null,
      },
    });

    if (kind === 'CHEF_MECANICIEN') {
      if (input.fuelRemainingT != null) {
        await tx.fluidEvent.create({
          data: {
            tugId: input.tugId,
            userId: actor.id,
            fluidType: 'CARBURANT',
            eventType: 'NIVEAU_DECLARE',
            quantity: input.fuelRemainingT,
            recordedAt: now,
          },
        });
      }
      if (input.oilRemainingL != null) {
        await tx.fluidEvent.create({
          data: {
            tugId: input.tugId,
            userId: actor.id,
            fluidType: 'HUILE',
            eventType: 'NIVEAU_DECLARE',
            quantity: input.oilRemainingL,
            recordedAt: now,
          },
        });
      }
      for (const reading of input.engineHourReadings ?? []) {
        if (reading.hours == null || Number.isNaN(reading.hours)) continue;
        await tx.engineHourReading.create({ data: { engineId: reading.engineId, hours: reading.hours, recordedAt: now } });
        await tx.engine.update({ where: { id: reading.engineId }, data: { currentHours: reading.hours } });
      }
    }

    await tx.postAssignment.update({ where: { id: assignment.id }, data: { endsAt: now } });

    const stillOpen = await tx.postAssignment.count({
      where: { serviceId: service.id, endsAt: null, poste: { name: { in: ['Capitaine', 'Chef mécanicien'] } } },
    });
    if (stillOpen === 0) {
      await tx.service.update({ where: { id: service.id }, data: { actualEnd: now } });
    }
  });

  revalidatePath('/tableau-de-bord');
  revalidatePath(`/flotte/${input.tugId}`);
  revalidatePath(`/flotte/${input.tugId}/machine`);
  return { ok: true };
}

export async function createHandoverContestation(input: {
  handoverDeclarationId: string;
  contestedItem: string;
  reason: string;
}): Promise<ActionResult> {
  const actor = await requireUser();
  if (!input.contestedItem.trim() || !input.reason.trim()) {
    return { ok: false, error: 'Élément contesté et motif requis.' };
  }
  await prisma.contestation.create({
    data: {
      handoverDeclarationId: input.handoverDeclarationId,
      authorId: actor.id,
      contestedItem: input.contestedItem,
      reason: input.reason,
    },
  });
  revalidatePath('/tableau-de-bord');
  return { ok: true };
}
