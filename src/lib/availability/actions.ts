'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/session';

export type ActionResult = { ok: true } | { ok: false; error: string };

export type DerivedStatus =
  | 'DISPONIBLE'
  | 'DISPONIBLE_SANS_EQUIPAGE'
  | 'OCCUPE'
  | 'MAINTENANCE'
  | 'DESARME'
  | 'ACTIVE_TEMPORAIREMENT'
  | 'INDISPONIBLE';

/**
 * Vue agrégée, pas une entité de données brute (décision module Disponibilité
 * opérationnelle) : combine Tug.statut + mission active + prise de service
 * active. Aucune détection de "conflit" — l'humain interprète les données
 * brutes affichées.
 */
export async function getAvailabilityOverview() {
  const actor = await requireRole('ADMINISTRATEUR', 'CHEF_ARMEMENT', 'DISPATCHER');
  const tugs = await prisma.tug.findMany({
    where: { companyId: actor.companyId, isArchived: false },
    orderBy: { name: 'asc' },
  });

  const rows = await Promise.all(
    tugs.map(async (tug) => {
      const activeMission = await prisma.mission.findFirst({
        where: { tugId: tug.id, status: 'EN_COURS' },
        include: { pilot: true, movementType: true },
      });

      const service = await prisma.service.findFirst({ where: { tugId: tug.id, actualEnd: null } });
      let captainOnDuty: string | null = null;
      let chefMecanicienOnDuty: string | null = null;
      if (service) {
        const assignments = await prisma.postAssignment.findMany({
          where: { serviceId: service.id, endsAt: null, poste: { name: { in: ['Capitaine', 'Chef mécanicien'] } } },
          include: { poste: true, user: true },
        });
        for (const a of assignments) {
          const label = `${a.user.firstName} ${a.user.lastName}`;
          if (a.poste.name === 'Capitaine') captainOnDuty = label;
          else chefMecanicienOnDuty = label;
        }
      }

      let derivedStatus: DerivedStatus;
      if (tug.status === 'DISPONIBLE') {
        derivedStatus = captainOnDuty && chefMecanicienOnDuty ? 'DISPONIBLE' : 'DISPONIBLE_SANS_EQUIPAGE';
      } else {
        derivedStatus = tug.status as DerivedStatus;
      }

      return {
        tug,
        derivedStatus,
        activeMission,
        captainOnDuty,
        chefMecanicienOnDuty,
      };
    })
  );

  return rows;
}

export async function updateDispatchNote(tugId: string, note: string): Promise<ActionResult> {
  await requireRole('ADMINISTRATEUR', 'CHEF_ARMEMENT', 'DISPATCHER');
  await prisma.tug.update({ where: { id: tugId }, data: { dispatchNote: note || null } });
  revalidatePath('/disponibilite');
  revalidatePath('/tableau-de-bord');
  return { ok: true };
}
