'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/session';

export type ActionResult = { ok: true } | { ok: false; error: string };

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
