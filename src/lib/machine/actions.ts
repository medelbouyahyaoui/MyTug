'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/session';
import type { EngineKind, FluidType, MachineState } from '@prisma/client';

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Vue d'ensemble technique d'un remorqueur : heures moteur par moteur,
 * carburant/huile (niveau déclaré courant + seuil d'alerte compagnie),
 * journal machine. Le niveau courant vient toujours du dernier événement
 * NIVEAU_DECLARE (relève du chef mécanicien) — jamais calculé à partir des
 * avitaillements, qui servent uniquement à l'historique de consommation.
 */
export async function getMachineOverview(tugId: string) {
  const actor = await requireUser();

  const [tug, engines, fuelEvents, oilEvents, logEntries, company] = await Promise.all([
    prisma.tug.findUniqueOrThrow({ where: { id: tugId } }),
    prisma.engine.findMany({
      where: { tugId },
      orderBy: [{ kind: 'asc' }, { label: 'asc' }],
      include: { hourReadings: { orderBy: { recordedAt: 'desc' }, take: 5 } },
    }),
    prisma.fluidEvent.findMany({ where: { tugId, fluidType: 'CARBURANT' }, orderBy: { recordedAt: 'desc' }, take: 10, include: { user: true } }),
    prisma.fluidEvent.findMany({ where: { tugId, fluidType: 'HUILE' }, orderBy: { recordedAt: 'desc' }, take: 10, include: { user: true } }),
    prisma.machineLogEntry.findMany({ where: { tugId }, orderBy: { createdAt: 'desc' }, take: 30, include: { user: true } }),
    prisma.company.findUniqueOrThrow({ where: { id: actor.companyId } }),
  ]);

  const currentFuelLevel = fuelEvents.find((e) => e.eventType === 'NIVEAU_DECLARE')?.quantity ?? null;
  const currentOilLevel = oilEvents.find((e) => e.eventType === 'NIVEAU_DECLARE')?.quantity ?? null;
  const fuelPct = currentFuelLevel != null && tug.fuelCapacityT ? (currentFuelLevel / tug.fuelCapacityT) * 100 : null;
  const oilPct = currentOilLevel != null && tug.oilCapacityL ? (currentOilLevel / tug.oilCapacityL) * 100 : null;
  const fuelAlert = fuelPct != null && fuelPct <= company.fuelAlertThresholdPct;
  const latestState = logEntries[0]?.state ?? null;

  return {
    tug,
    engines,
    fuelEvents,
    oilEvents,
    logEntries,
    currentFuelLevel,
    currentOilLevel,
    fuelPct,
    oilPct,
    fuelAlert,
    latestState,
    fuelAlertThresholdPct: company.fuelAlertThresholdPct,
    canWrite: actor.role === 'CHEF_MECANICIEN',
    canManageEngines: actor.role === 'ADMINISTRATEUR' || actor.role === 'CHEF_ARMEMENT',
  };
}

export async function createEngine(input: {
  tugId: string;
  kind: EngineKind;
  label: string;
  manufacturer?: string;
  model?: string;
  powerKw?: number;
}): Promise<ActionResult> {
  const actor = await requireUser();
  if (actor.role !== 'ADMINISTRATEUR' && actor.role !== 'CHEF_ARMEMENT') {
    return { ok: false, error: "Réservé à l'administrateur et au chef d'armement." };
  }
  if (!input.label.trim()) return { ok: false, error: 'Libellé requis.' };

  await prisma.engine.create({
    data: {
      tugId: input.tugId,
      kind: input.kind,
      label: input.label,
      manufacturer: input.manufacturer || null,
      model: input.model || null,
      powerKw: input.powerKw ?? null,
    },
  });

  revalidatePath(`/flotte/${input.tugId}/machine`);
  return { ok: true };
}

export async function createMachineLogEntry(input: {
  tugId: string;
  state: MachineState;
  observation: string;
  isIncident: boolean;
  correctiveAction?: string;
  remarks?: string;
}): Promise<ActionResult> {
  const actor = await requireUser();
  if (actor.role !== 'CHEF_MECANICIEN') return { ok: false, error: 'Réservé au chef mécanicien.' };
  if (!input.observation.trim()) return { ok: false, error: 'Observation requise.' };

  await prisma.machineLogEntry.create({
    data: {
      tugId: input.tugId,
      userId: actor.id,
      state: input.state,
      observation: input.observation,
      isIncident: input.isIncident,
      correctiveAction: input.correctiveAction || null,
      remarks: input.remarks || null,
    },
  });

  revalidatePath(`/flotte/${input.tugId}/machine`);
  return { ok: true };
}

export async function createFluidRefill(input: {
  tugId: string;
  fluidType: FluidType;
  quantity: number;
}): Promise<ActionResult> {
  const actor = await requireUser();
  if (actor.role !== 'CHEF_MECANICIEN') return { ok: false, error: 'Réservé au chef mécanicien.' };
  if (!input.quantity || input.quantity <= 0) return { ok: false, error: 'Quantité invalide.' };

  await prisma.fluidEvent.create({
    data: { tugId: input.tugId, userId: actor.id, fluidType: input.fluidType, eventType: 'AVITAILLEMENT', quantity: input.quantity },
  });

  revalidatePath(`/flotte/${input.tugId}/machine`);
  return { ok: true };
}
