'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/session';

export type ActionResult = { ok: true } | { ok: false; error: string };
export type CreateResult = { ok: true; id: string } | { ok: false; error: string };

export async function getCompany() {
  const actor = await requireRole('ADMINISTRATEUR', 'CHEF_ARMEMENT');
  return prisma.company.findUniqueOrThrow({ where: { id: actor.companyId } });
}

export async function updateCompany(input: {
  name: string;
  homePort: string;
  address: string;
  serviceCycleWorkDays: number;
  serviceCycleRestDays: number;
  reliefTimeOfDay: string;
  fuelAlertThresholdPct: number;
  maintenanceHoursAlert1: number;
  maintenanceHoursAlert2: number;
  maintenanceDaysAlert1: number;
  maintenanceDaysAlert2: number;
  maintenanceDaysAlert3: number;
  certificateDaysAlert1: number;
  certificateDaysAlert2: number;
  certificateDaysAlert3: number;
  emailNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
}): Promise<ActionResult> {
  // Seul l'Administrateur gère les réglages généraux de la compagnie
  // (le Chef d'armement co-gère les référentiels, pas ces réglages structurels).
  const actor = await requireRole('ADMINISTRATEUR');

  const before = await prisma.company.findUniqueOrThrow({ where: { id: actor.companyId } });

  await prisma.company.update({
    where: { id: actor.companyId },
    data: input,
  });

  const changed: { parameter: string; oldValue: string; newValue: string }[] = [];
  for (const key of Object.keys(input) as (keyof typeof input)[]) {
    const oldValue = String(before[key]);
    const newValue = String(input[key]);
    if (oldValue !== newValue) changed.push({ parameter: key, oldValue, newValue });
  }
  if (changed.length > 0) {
    await prisma.configChangeLog.createMany({
      data: changed.map((c) => ({ companyId: actor.companyId, userId: actor.id, ...c })),
    });
  }

  revalidatePath('/administration/societe');
  return { ok: true };
}

/** Postes d'équipage — Société (§3/§45, avec Types de documents). */
export async function getAllPostes() {
  const actor = await requireRole('ADMINISTRATEUR', 'CHEF_ARMEMENT');
  return prisma.poste.findMany({ where: { companyId: actor.companyId }, orderBy: { name: 'asc' } });
}

export async function createPoste(name: string): Promise<CreateResult> {
  const actor = await requireRole('ADMINISTRATEUR', 'CHEF_ARMEMENT');
  if (!name.trim()) return { ok: false, error: 'Nom requis.' };
  const existing = await prisma.poste.findFirst({ where: { companyId: actor.companyId, name } });
  if (existing) return { ok: false, error: 'Ce poste existe déjà.' };
  const poste = await prisma.poste.create({ data: { companyId: actor.companyId, name } });
  revalidatePath('/administration/societe');
  return { ok: true, id: poste.id };
}

export async function togglePosteArchived(id: string, isArchived: boolean): Promise<ActionResult> {
  await requireRole('ADMINISTRATEUR', 'CHEF_ARMEMENT');
  await prisma.poste.update({ where: { id }, data: { isArchived } });
  revalidatePath('/administration/societe');
  return { ok: true };
}
