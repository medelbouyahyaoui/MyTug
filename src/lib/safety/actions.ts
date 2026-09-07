'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/session';

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function getSafetyOverview(tugId: string) {
  const actor = await requireUser();

  const observations = await prisma.safetyObservation.findMany({
    where: { tugId },
    include: {
      author: true,
      validatedBy: true,
      correctiveActions: { orderBy: { createdAt: 'asc' } },
      contestations: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    observations,
    canCreate: actor.role === 'CAPITAINE',
    canValidate: actor.role === 'CHEF_ARMEMENT',
    currentUserId: actor.id,
  };
}

function canActOnObservation(actor: { id: string; role: string }, observation: { authorId: string }) {
  return actor.role === 'CHEF_ARMEMENT' || actor.id === observation.authorId;
}

export async function createSafetyObservation(input: { tugId: string; description: string }): Promise<ActionResult> {
  const actor = await requireUser();
  if (actor.role !== 'CAPITAINE') return { ok: false, error: 'Réservé au capitaine.' };
  if (!input.description.trim()) return { ok: false, error: 'Description requise.' };

  await prisma.safetyObservation.create({
    data: { tugId: input.tugId, authorId: actor.id, description: input.description },
  });

  revalidatePath(`/flotte/${input.tugId}/securite`);
  return { ok: true };
}

export async function submitSafetyObservation(id: string): Promise<ActionResult> {
  const actor = await requireUser();
  const observation = await prisma.safetyObservation.findUnique({ where: { id } });
  if (!observation) return { ok: false, error: 'Observation introuvable.' };
  if (observation.authorId !== actor.id) return { ok: false, error: "Seul l'auteur peut soumettre cette observation." };
  if (observation.status !== 'BROUILLON') return { ok: false, error: 'Déjà soumise.' };

  await prisma.safetyObservation.update({ where: { id }, data: { status: 'SOUMIS' } });
  revalidatePath(`/flotte/${observation.tugId}/securite`);
  return { ok: true };
}

export async function validateSafetyObservation(id: string): Promise<ActionResult> {
  const actor = await requireUser();
  if (actor.role !== 'CHEF_ARMEMENT') return { ok: false, error: "Réservé au chef d'armement." };

  const observation = await prisma.safetyObservation.findUnique({ where: { id } });
  if (!observation) return { ok: false, error: 'Observation introuvable.' };
  if (observation.status !== 'SOUMIS') return { ok: false, error: 'Cette observation n\'est pas en attente de validation.' };

  await prisma.safetyObservation.update({
    where: { id },
    data: { status: 'VALIDE', validatedById: actor.id, validatedAt: new Date() },
  });
  revalidatePath(`/flotte/${observation.tugId}/securite`);
  return { ok: true };
}

export async function createCorrectiveAction(input: {
  safetyObservationId: string;
  description: string;
  responsible?: string;
  dueDate?: string;
}): Promise<ActionResult> {
  const actor = await requireUser();
  const observation = await prisma.safetyObservation.findUnique({ where: { id: input.safetyObservationId } });
  if (!observation) return { ok: false, error: 'Observation introuvable.' };
  if (!canActOnObservation(actor, observation)) {
    return { ok: false, error: "Réservé à l'auteur de l'observation et au chef d'armement." };
  }
  if (!input.description.trim()) return { ok: false, error: 'Description requise.' };

  await prisma.safetyCorrectiveAction.create({
    data: {
      safetyObservationId: input.safetyObservationId,
      description: input.description,
      responsible: input.responsible || null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    },
  });

  revalidatePath(`/flotte/${observation.tugId}/securite`);
  return { ok: true };
}

export async function toggleCorrectiveActionStatus(id: string, status: string): Promise<ActionResult> {
  const actor = await requireUser();
  const action = await prisma.safetyCorrectiveAction.update({
    where: { id },
    data: { status },
    include: { safetyObservation: true },
  });
  if (!canActOnObservation(actor, action.safetyObservation)) {
    return { ok: false, error: "Réservé à l'auteur de l'observation et au chef d'armement." };
  }

  revalidatePath(`/flotte/${action.safetyObservation.tugId}/securite`);
  return { ok: true };
}

export async function createSafetyContestation(input: {
  safetyObservationId: string;
  contestedItem: string;
  reason: string;
}): Promise<ActionResult> {
  const actor = await requireUser();
  const observation = await prisma.safetyObservation.findUnique({ where: { id: input.safetyObservationId } });
  if (!observation) return { ok: false, error: 'Observation introuvable.' };
  if (observation.status !== 'VALIDE') return { ok: false, error: 'Seule une observation validée peut être contestée.' };
  if (!canActOnObservation(actor, observation)) {
    return { ok: false, error: "Réservé à l'auteur de l'observation et au chef d'armement." };
  }
  if (!input.contestedItem.trim() || !input.reason.trim()) {
    return { ok: false, error: 'Élément contesté et motif requis.' };
  }

  await prisma.contestation.create({
    data: {
      safetyObservationId: input.safetyObservationId,
      authorId: actor.id,
      contestedItem: input.contestedItem,
      reason: input.reason,
    },
  });

  revalidatePath(`/flotte/${observation.tugId}/securite`);
  return { ok: true };
}
