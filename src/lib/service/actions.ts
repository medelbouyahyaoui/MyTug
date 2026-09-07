'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/session';
import type { CurrentUser } from '@/lib/auth/session';

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Le service en cours d'un remorqueur = celui dont la fin réelle n'est pas
 * encore enregistrée. Pas de planning prévisionnel — uniquement l'historique
 * réel (décision module Équipages).
 */
export async function getActiveService(tugId: string) {
  return prisma.service.findFirst({
    where: { tugId, actualEnd: null },
    orderBy: { plannedStart: 'desc' },
  });
}

export async function getCrewForTug(tugId: string) {
  const actor = await requireUser();
  const postes = await prisma.poste.findMany({
    where: { companyId: actor.companyId, isArchived: false },
    orderBy: { createdAt: 'asc' },
  });
  const service = await getActiveService(tugId);

  if (!service) return { service: null, postes, assignments: [] };

  const assignments = await prisma.postAssignment.findMany({
    where: { serviceId: service.id, endsAt: null },
    include: { user: true, poste: true },
  });

  return { service, postes, assignments };
}

export async function listAssignableUsers() {
  const actor = await requireUser();
  return prisma.user.findMany({
    where: { companyId: actor.companyId, status: 'ACTIF' },
    orderBy: [{ lastName: 'asc' }],
  });
}

async function canDeclareForService(actor: CurrentUser, serviceId: string): Promise<boolean> {
  if (actor.role === 'CHEF_ARMEMENT') return true;
  if (actor.role !== 'CAPITAINE') return false;
  const captainAssignment = await prisma.postAssignment.findFirst({
    where: {
      serviceId,
      userId: actor.id,
      endsAt: null,
      poste: { name: 'Capitaine' },
    },
  });
  return !!captainAssignment;
}

/**
 * Affectation ou remplacement — modèle unifié (décision module Équipages) :
 * clôture l'assignation en cours pour ce poste (s'il y en a une) et en ouvre
 * une nouvelle. Réservé au capitaine du service concerné et au chef
 * d'armement (section 14).
 */
export async function declareAssignment(input: {
  tugId: string;
  posteId: string;
  userId: string;
  startsAt: string;
  reason?: string;
}): Promise<ActionResult> {
  const actor = await requireUser();
  const service = await getActiveService(input.tugId);
  if (!service) return { ok: false, error: 'Aucun service en cours sur ce remorqueur.' };

  const allowed = await canDeclareForService(actor, service.id);
  if (!allowed) {
    return {
      ok: false,
      error: "Seuls le capitaine du service concerné et le chef d'armement peuvent déclarer une affectation.",
    };
  }

  const startsAt = new Date(input.startsAt);

  await prisma.$transaction([
    prisma.postAssignment.updateMany({
      where: { serviceId: service.id, posteId: input.posteId, endsAt: null },
      data: { endsAt: startsAt },
    }),
    prisma.postAssignment.create({
      data: {
        tugId: input.tugId,
        posteId: input.posteId,
        userId: input.userId,
        serviceId: service.id,
        startsAt,
        reason: input.reason || null,
        declaredById: actor.id,
      },
    }),
  ]);

  revalidatePath(`/flotte/${input.tugId}/equipage`);
  return { ok: true };
}
