'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/session';
import { getMachineOverview } from '@/lib/machine/actions';
import { getMaintenanceOverview } from '@/lib/maintenance/actions';
import { getAvailabilityOverview } from '@/lib/availability/actions';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getCaptainDashboard(tugId: string) {
  const actor = await requireUser();

  const [tug, service, activeMission, recentMissions, myPendingExercises, pendingContestations, notifications] = await Promise.all([
    prisma.tug.findUniqueOrThrow({ where: { id: tugId } }),
    prisma.service.findFirst({
      where: { tugId, actualEnd: null },
      include: { postAssignments: { where: { endsAt: null }, include: { poste: true, user: true } } },
    }),
    prisma.mission.findFirst({ where: { tugId, status: 'EN_COURS' }, include: { pilot: true, movementType: true } }),
    prisma.mission.findMany({ where: { tugId }, orderBy: { departureFromDockAt: 'desc' }, take: 5, include: { pilot: true, movementType: true } }),
    prisma.exerciseProgramEntry.findMany({
      where: { tugId, captainId: actor.id, status: { in: ['PREVU', 'A_VENIR', 'EN_RETARD'] } },
      include: { type: true, execution: true },
    }),
    prisma.contestation.findMany({
      where: { handoverDeclaration: { userId: actor.id, kind: 'CAPITAINE' }, status: 'OUVERTE' },
      include: { author: true },
    }),
    prisma.notification.findMany({ where: { userId: actor.id, isRead: false }, orderBy: { createdAt: 'desc' }, take: 5 }),
  ]);

  const currentFuel = await prisma.fluidEvent.findFirst({ where: { tugId, fluidType: 'CARBURANT', eventType: 'NIVEAU_DECLARE' }, orderBy: { recordedAt: 'desc' } });
  const engines = await prisma.engine.findMany({ where: { tugId } });

  return {
    tug,
    service,
    activeMission,
    recentMissions,
    myPendingExercises: myPendingExercises.filter((e) => !e.execution),
    pendingContestations,
    notifications,
    currentFuel,
    engines,
  };
}

export async function getChefMecanicienDashboard(tugId: string) {
  const [machine, maintenance] = await Promise.all([getMachineOverview(tugId), getMaintenanceOverview(tugId)]);

  const correctiveInterventions = maintenance.interventions.filter((i) => i.type === 'CORRECTIVE').slice(0, 5);
  const upcoming = maintenance.plans.filter((p) => p.urgency === 'BIENTOT');
  const overdue = maintenance.plans.filter((p) => p.urgency === 'ECHU');

  const actor = await requireUser();
  const notifications = await prisma.notification.findMany({ where: { userId: actor.id, isRead: false }, orderBy: { createdAt: 'desc' }, take: 5 });

  return { machine, plans: maintenance.plans, upcoming, overdue, correctiveInterventions, notifications };
}

export async function getChefArmementDashboard() {
  const actor = await requireUser();
  const companyId = actor.companyId;

  const [availability, recentMissions, notifications] = await Promise.all([
    getAvailabilityOverview(),
    prisma.mission.findMany({
      where: { tug: { companyId } },
      orderBy: { departureFromDockAt: 'desc' },
      take: 8,
      include: { tug: true, pilot: true, movementType: true },
    }),
    prisma.notification.findMany({ where: { userId: actor.id, isRead: false }, orderBy: { createdAt: 'desc' }, take: 8 }),
  ]);

  const plans = await prisma.maintenancePlan.findMany({
    where: { tug: { companyId } },
    include: { engine: true, tug: true },
  });
  const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
  const maintenanceDue = plans.filter((p) => {
    const remainingHours = p.nextDueHours != null && p.engine ? p.nextDueHours - p.engine.currentHours : null;
    const remainingDays = p.nextDueAt != null ? (p.nextDueAt.getTime() - Date.now()) / DAY_MS : null;
    return (remainingHours != null && remainingHours <= company.maintenanceHoursAlert1) || (remainingDays != null && remainingDays <= company.maintenanceDaysAlert1);
  });

  const certificates = await prisma.certificate.findMany({ where: { tug: { companyId } }, include: { type: true, tug: true } });
  const expiringCertificates = certificates.filter((c) => c.expiresAt && (c.expiresAt.getTime() - Date.now()) / DAY_MS <= company.certificateDaysAlert1);

  const exercises = await prisma.exerciseProgramEntry.findMany({
    where: { tug: { companyId }, status: { in: ['PREVU', 'A_VENIR', 'EN_RETARD'] } },
    include: { type: true, tug: true, captain: true, execution: true },
  });
  const pendingExercises = exercises.filter((e) => !e.execution);

  const pendingSafety = await prisma.safetyObservation.findMany({
    where: { tug: { companyId }, status: 'SOUMIS' },
    include: { tug: true, author: true },
  });

  return { availability, recentMissions, notifications, maintenanceDue, expiringCertificates, pendingExercises, pendingSafety };
}

export async function getAdminDashboard() {
  const actor = await requireUser();
  const companyId = actor.companyId;

  const [company, tugCount, activeUserCount, notifications] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: companyId } }),
    prisma.tug.count({ where: { companyId, isArchived: false } }),
    prisma.user.count({ where: { companyId, status: 'ACTIF' } }),
    prisma.notification.findMany({ where: { userId: actor.id, isRead: false }, orderBy: { createdAt: 'desc' }, take: 8 }),
  ]);

  return { company, tugCount, activeUserCount, notifications };
}
