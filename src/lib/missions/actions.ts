'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/session';
import { getActiveService } from '@/lib/service/actions';

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function getMissionContext(tugId: string) {
  const actor = await requireUser();
  const service = await getActiveService(tugId);

  const activeMission = await prisma.mission.findFirst({
    where: { tugId, status: 'EN_COURS' },
    include: { pilot: true, movementType: true },
  });

  const [pilots, movementTypes, tugTypes] = await Promise.all([
    prisma.pilot.findMany({ where: { companyId: actor.companyId, isArchived: false }, orderBy: { name: 'asc' } }),
    prisma.movementType.findMany({ where: { companyId: actor.companyId, isArchived: false }, orderBy: { name: 'asc' } }),
    prisma.tugType.findMany({ where: { companyId: actor.companyId, isArchived: false }, orderBy: { name: 'asc' } }),
  ]);

  // Opérations actuellement ouvertes sur les AUTRES remorqueurs de la compagnie.
  const openOperations = await prisma.mission.findMany({
    where: { tugId: { not: tugId }, status: 'EN_COURS', tug: { companyId: actor.companyId } },
    include: { tug: true, pilot: true, movementType: true },
    orderBy: { departureFromDockAt: 'desc' },
  });

  const isCaptainOnDuty = service
    ? !!(await prisma.postAssignment.findFirst({
        where: { serviceId: service.id, userId: actor.id, endsAt: null, poste: { name: 'Capitaine' } },
      }))
    : false;

  return { service, activeMission, pilots, movementTypes, tugTypes, openOperations, isCaptainOnDuty };
}

export async function listMissions() {
  const actor = await requireUser();
  return prisma.mission.findMany({
    where: { tug: { companyId: actor.companyId } },
    include: { tug: true, pilot: true, movementType: true },
    orderBy: { departureFromDockAt: 'desc' },
    take: 100,
  });
}

async function assertCaptainOnDuty(tugId: string, serviceId: string) {
  const actor = await requireUser();
  if (actor.role !== 'CAPITAINE') {
    return { ok: false as const, error: 'Seul le capitaine en service actif peut créer une mission.' };
  }
  const assignment = await prisma.postAssignment.findFirst({
    where: { serviceId, userId: actor.id, endsAt: null, poste: { name: 'Capitaine' } },
  });
  if (!assignment) {
    return { ok: false as const, error: 'Seul le capitaine en service actif sur ce remorqueur peut créer une mission.' };
  }
  return { ok: true as const, actor };
}

export async function createMission(input: {
  tugId: string;
  pilotId: string;
  vesselName: string;
  movementTypeId: string;
  movementTypeOtherDetail?: string;
  position?: string;
  requestedTugTypeId?: string;
  externalAssistanceRequested?: boolean;
  externalAssistanceCompany?: string;
  externalAssistanceReason?: string;
  joinOperationMissionId?: string;
}): Promise<ActionResult> {
  const service = await getActiveService(input.tugId);
  if (!service) return { ok: false, error: 'Aucun service en cours sur ce remorqueur.' };

  const check = await assertCaptainOnDuty(input.tugId, service.id);
  if (!check.ok) return { ok: false, error: check.error };

  const existingOpen = await prisma.mission.findFirst({ where: { tugId: input.tugId, status: 'EN_COURS' } });
  if (existingOpen) {
    return { ok: false, error: "Ce remorqueur a déjà une mission en cours — clôturez-la d'abord." };
  }

  let operationGroupId: string | undefined;
  let pilotId = input.pilotId;
  let vesselName = input.vesselName;
  let movementTypeId = input.movementTypeId;
  let movementTypeOtherDetail = input.movementTypeOtherDetail;

  if (input.joinOperationMissionId) {
    const joined = await prisma.mission.findUnique({ where: { id: input.joinOperationMissionId } });
    if (!joined || joined.status !== 'EN_COURS') {
      return { ok: false, error: 'Cette opération n\'est plus ouverte.' };
    }
    operationGroupId = joined.operationGroupId ?? randomUUID();
    if (!joined.operationGroupId) {
      await prisma.mission.update({ where: { id: joined.id }, data: { operationGroupId } });
    }
    pilotId = joined.pilotId;
    vesselName = joined.vesselName;
    movementTypeId = joined.movementTypeId;
    movementTypeOtherDetail = joined.movementTypeOtherDetail ?? undefined;
  }

  await prisma.mission.create({
    data: {
      tugId: input.tugId,
      serviceId: service.id,
      operationGroupId,
      pilotId,
      vesselName,
      movementTypeId,
      movementTypeOtherDetail: movementTypeOtherDetail || null,
      position: input.position || null,
      departureFromDockAt: new Date(),
      requestedTugTypeId: input.requestedTugTypeId || null,
      externalAssistanceRequested: input.externalAssistanceRequested ?? false,
      externalAssistanceCompany: input.externalAssistanceCompany || null,
      externalAssistanceReason: input.externalAssistanceReason || null,
      createdById: check.actor.id,
    },
  });

  await prisma.tug.update({ where: { id: input.tugId }, data: { status: 'OCCUPE' } });

  revalidatePath(`/flotte/${input.tugId}/mission`);
  revalidatePath('/flotte');
  revalidatePath('/missions');
  return { ok: true };
}

type MissionStep = 'movementStartAt' | 'movementEndAt' | 'returnToDockAt';

export async function markMissionStep(
  missionId: string,
  step: MissionStep,
  at: string
): Promise<ActionResult> {
  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission) return { ok: false, error: 'Mission introuvable.' };

  const check = await assertCaptainOnDuty(mission.tugId, mission.serviceId);
  if (!check.ok) return { ok: false, error: check.error };

  const timestamp = new Date(at);

  if (step === 'returnToDockAt') {
    await prisma.$transaction([
      prisma.mission.update({
        where: { id: missionId },
        data: { returnToDockAt: timestamp, status: 'TERMINEE' },
      }),
      prisma.tug.update({ where: { id: mission.tugId }, data: { status: 'DISPONIBLE' } }),
    ]);
  } else {
    await prisma.mission.update({ where: { id: missionId }, data: { [step]: timestamp } });
  }

  revalidatePath(`/flotte/${mission.tugId}/mission`);
  revalidatePath('/flotte');
  revalidatePath('/missions');
  return { ok: true };
}

export async function cancelMission(missionId: string): Promise<ActionResult> {
  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission) return { ok: false, error: 'Mission introuvable.' };

  const check = await assertCaptainOnDuty(mission.tugId, mission.serviceId);
  if (!check.ok) return { ok: false, error: check.error };

  await prisma.$transaction([
    prisma.mission.update({ where: { id: missionId }, data: { status: 'ANNULEE' } }),
    prisma.tug.update({ where: { id: mission.tugId }, data: { status: 'DISPONIBLE' } }),
  ]);

  revalidatePath(`/flotte/${mission.tugId}/mission`);
  revalidatePath('/flotte');
  revalidatePath('/missions');
  return { ok: true };
}
