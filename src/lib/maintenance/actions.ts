'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/session';
import type { MaintenanceCalendarUnit, MaintenanceIntervalType, MaintenanceType } from '@prisma/client';

export type ActionResult = { ok: true } | { ok: false; error: string };

const DAY_MS = 24 * 60 * 60 * 1000;

function addCalendar(base: Date, value: number, unit: MaintenanceCalendarUnit) {
  const d = new Date(base);
  if (unit === 'JOURS') d.setDate(d.getDate() + value);
  else if (unit === 'MOIS') d.setMonth(d.getMonth() + value);
  else d.setFullYear(d.getFullYear() + value);
  return d;
}

/** Recalcule la prochaine échéance (heures et/ou calendaire) à partir de la dernière réalisation. */
function computeNextDue(plan: {
  intervalType: MaintenanceIntervalType;
  intervalHours: number | null;
  intervalCalendarValue: number | null;
  intervalCalendarUnit: MaintenanceCalendarUnit | null;
  lastDoneAt: Date | null;
  lastDoneHours: number | null;
}) {
  let nextDueAt: Date | null = null;
  let nextDueHours: number | null = null;

  if ((plan.intervalType === 'HEURES' || plan.intervalType === 'LES_DEUX') && plan.intervalHours != null) {
    nextDueHours = (plan.lastDoneHours ?? 0) + plan.intervalHours;
  }
  if (
    (plan.intervalType === 'CALENDAIRE' || plan.intervalType === 'LES_DEUX') &&
    plan.intervalCalendarValue != null &&
    plan.intervalCalendarUnit
  ) {
    nextDueAt = addCalendar(plan.lastDoneAt ?? new Date(), plan.intervalCalendarValue, plan.intervalCalendarUnit);
  }

  return { nextDueAt, nextDueHours };
}

type Urgency = 'OK' | 'BIENTOT' | 'ECHU';

function urgencyFromHours(remaining: number | null, alert1: number, alert2: number): Urgency | null {
  if (remaining == null) return null;
  if (remaining <= 0) return 'ECHU';
  if (remaining <= alert2 || remaining <= alert1) return 'BIENTOT';
  return 'OK';
}

function urgencyFromDays(remainingDays: number | null, alert1: number, alert2: number, alert3: number): Urgency | null {
  if (remainingDays == null) return null;
  if (remainingDays <= 0) return 'ECHU';
  if (remainingDays <= alert1 || remainingDays <= alert2 || remainingDays <= alert3) return 'BIENTOT';
  return 'OK';
}

function worstUrgency(a: Urgency | null, b: Urgency | null): Urgency | null {
  const rank: Record<Urgency, number> = { OK: 0, BIENTOT: 1, ECHU: 2 };
  if (a && b) return rank[a] >= rank[b] ? a : b;
  return a ?? b;
}

export async function getMaintenanceOverview(tugId: string) {
  const actor = await requireUser();

  const [tug, engines, equipmentTypes, plans, interventions, company] = await Promise.all([
    prisma.tug.findUniqueOrThrow({ where: { id: tugId } }),
    prisma.engine.findMany({ where: { tugId }, orderBy: [{ kind: 'asc' }, { label: 'asc' }] }),
    prisma.maintenanceEquipmentType.findMany({ where: { companyId: actor.companyId, isArchived: false }, orderBy: { name: 'asc' } }),
    prisma.maintenancePlan.findMany({
      where: { tugId },
      include: { engine: true, equipmentType: true, responsible: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.maintenanceIntervention.findMany({
      where: { tugId },
      include: { tasks: { orderBy: { order: 'asc' } }, responsible: true, plan: { include: { engine: true, equipmentType: true } } },
      orderBy: { occurredAt: 'desc' },
      take: 30,
    }),
    prisma.company.findUniqueOrThrow({ where: { id: actor.companyId } }),
  ]);

  const plansWithStatus = plans.map((plan) => {
    const remainingHours = plan.nextDueHours != null && plan.engine ? plan.nextDueHours - plan.engine.currentHours : null;
    const remainingDays = plan.nextDueAt != null ? (plan.nextDueAt.getTime() - Date.now()) / DAY_MS : null;
    const urgency = worstUrgency(
      urgencyFromHours(remainingHours, company.maintenanceHoursAlert1, company.maintenanceHoursAlert2),
      urgencyFromDays(remainingDays, company.maintenanceDaysAlert1, company.maintenanceDaysAlert2, company.maintenanceDaysAlert3)
    );
    return { ...plan, remainingHours, remainingDays, urgency };
  });

  return {
    tug,
    engines,
    equipmentTypes,
    plans: plansWithStatus,
    interventions,
    canWrite: actor.role === 'CHEF_MECANICIEN',
    canManageEquipmentTypes: actor.role === 'ADMINISTRATEUR' || actor.role === 'CHEF_ARMEMENT',
  };
}

export async function createEquipmentType(name: string): Promise<ActionResult> {
  const actor = await requireUser();
  if (actor.role !== 'ADMINISTRATEUR' && actor.role !== 'CHEF_ARMEMENT') {
    return { ok: false, error: "Réservé à l'administrateur et au chef d'armement." };
  }
  if (!name.trim()) return { ok: false, error: 'Nom requis.' };
  await prisma.maintenanceEquipmentType.create({ data: { companyId: actor.companyId, name } });
  return { ok: true };
}

export async function createMaintenancePlan(input: {
  tugId: string;
  engineId?: string;
  equipmentTypeId?: string;
  equipmentFreeText?: string;
  intervalType: MaintenanceIntervalType;
  intervalHours?: number;
  intervalCalendarValue?: number;
  intervalCalendarUnit?: MaintenanceCalendarUnit;
  lastDoneAt?: string;
  lastDoneHours?: number;
  instructions?: string;
}): Promise<ActionResult> {
  const actor = await requireUser();
  if (actor.role !== 'CHEF_MECANICIEN') return { ok: false, error: 'Réservé au chef mécanicien.' };
  if (!input.engineId && !input.equipmentTypeId && !input.equipmentFreeText) {
    return { ok: false, error: 'Équipement requis (moteur, type référencé, ou libre).' };
  }

  const lastDoneAt = input.lastDoneAt ? new Date(input.lastDoneAt) : null;
  const lastDoneHours = input.lastDoneHours ?? null;
  const { nextDueAt, nextDueHours } = computeNextDue({
    intervalType: input.intervalType,
    intervalHours: input.intervalHours ?? null,
    intervalCalendarValue: input.intervalCalendarValue ?? null,
    intervalCalendarUnit: input.intervalCalendarUnit ?? null,
    lastDoneAt,
    lastDoneHours,
  });

  await prisma.maintenancePlan.create({
    data: {
      tugId: input.tugId,
      engineId: input.engineId || null,
      equipmentTypeId: input.equipmentTypeId || null,
      equipmentFreeText: input.equipmentFreeText || null,
      intervalType: input.intervalType,
      intervalHours: input.intervalHours ?? null,
      intervalCalendarValue: input.intervalCalendarValue ?? null,
      intervalCalendarUnit: input.intervalCalendarUnit ?? null,
      lastDoneAt,
      lastDoneHours,
      nextDueAt,
      nextDueHours,
      responsibleId: actor.id,
      instructions: input.instructions || null,
    },
  });

  revalidatePath(`/flotte/${input.tugId}/maintenance`);
  return { ok: true };
}

export async function createMaintenanceIntervention(input: {
  tugId: string;
  planId?: string;
  type: MaintenanceType;
  occurredAt?: string;
  engineHoursAtIntervention?: number;
  description?: string;
  performedBy?: string;
  status?: string;
  partsUsed?: string;
  remarks?: string;
  tasks?: { description: string; isRequired: boolean }[];
  fromMachineLogEntryId?: string;
}): Promise<ActionResult> {
  const actor = await requireUser();
  if (actor.role !== 'CHEF_MECANICIEN') return { ok: false, error: 'Réservé au chef mécanicien.' };

  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();

  const intervention = await prisma.maintenanceIntervention.create({
    data: {
      tugId: input.tugId,
      planId: input.planId || null,
      type: input.type,
      occurredAt,
      engineHoursAtIntervention: input.engineHoursAtIntervention ?? null,
      description: input.description || null,
      performedBy: input.performedBy || null,
      responsibleId: actor.id,
      status: input.status || 'terminée',
      partsUsed: input.partsUsed || null,
      remarks: input.remarks || null,
      tasks: input.tasks?.length
        ? { create: input.tasks.map((t, i) => ({ description: t.description, order: i, isRequired: t.isRequired })) }
        : undefined,
    },
  });

  if (input.fromMachineLogEntryId) {
    await prisma.machineLogEntry.update({
      where: { id: input.fromMachineLogEntryId },
      data: { linkedMaintenanceInterventionId: intervention.id },
    });
  }

  if (input.planId && input.status !== 'planifiée') {
    const plan = await prisma.maintenancePlan.findUnique({ where: { id: input.planId } });
    if (plan) {
      const lastDoneAt = occurredAt;
      const lastDoneHours = input.engineHoursAtIntervention ?? plan.lastDoneHours;
      const { nextDueAt, nextDueHours } = computeNextDue({
        intervalType: plan.intervalType,
        intervalHours: plan.intervalHours,
        intervalCalendarValue: plan.intervalCalendarValue,
        intervalCalendarUnit: plan.intervalCalendarUnit,
        lastDoneAt,
        lastDoneHours,
      });
      await prisma.maintenancePlan.update({
        where: { id: plan.id },
        data: { lastDoneAt, lastDoneHours, nextDueAt, nextDueHours },
      });
    }
  }

  revalidatePath(`/flotte/${input.tugId}/maintenance`);
  revalidatePath(`/flotte/${input.tugId}/machine`);
  return { ok: true };
}

export async function toggleMaintenanceTask(taskId: string, isDone: boolean): Promise<ActionResult> {
  const actor = await requireUser();
  if (actor.role !== 'CHEF_MECANICIEN') return { ok: false, error: 'Réservé au chef mécanicien.' };

  const task = await prisma.maintenanceTask.update({
    where: { id: taskId },
    data: { isDone, doneAt: isDone ? new Date() : null },
    include: { intervention: true },
  });

  revalidatePath(`/flotte/${task.intervention.tugId}/maintenance`);
  return { ok: true };
}
