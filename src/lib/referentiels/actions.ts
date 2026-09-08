'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/session';
import type { RefKind } from './constants';

export type ActionResult = { ok: true } | { ok: false; error: string };
export type CreateResult = { ok: true; id: string } | { ok: false; error: string };

type Item = { id: string; name: string; isArchived: boolean };

export async function getReferentiels(): Promise<Record<RefKind, Item[]>> {
  const actor = await requireRole('ADMINISTRATEUR', 'CHEF_ARMEMENT');
  const companyId = actor.companyId;

  const [pilots, movementTypes, certificateTypes, exerciseTypes, equipmentTypes, tugTypes] = await Promise.all([
    prisma.pilot.findMany({ where: { companyId }, orderBy: { name: 'asc' } }),
    prisma.movementType.findMany({ where: { companyId }, orderBy: { name: 'asc' } }),
    prisma.certificateType.findMany({ where: { companyId }, orderBy: { name: 'asc' } }),
    prisma.exerciseType.findMany({ where: { companyId }, orderBy: { name: 'asc' } }),
    prisma.maintenanceEquipmentType.findMany({ where: { companyId }, orderBy: { name: 'asc' } }),
    prisma.tugType.findMany({ where: { companyId }, orderBy: { name: 'asc' } }),
  ]);

  return {
    PILOT: pilots,
    MOVEMENT_TYPE: movementTypes,
    CERTIFICATE_TYPE: certificateTypes,
    EXERCISE_TYPE: exerciseTypes,
    MAINTENANCE_EQUIPMENT_TYPE: equipmentTypes,
    TUG_TYPE: tugTypes,
  };
}

export async function createReferentielItem(kind: RefKind, name: string): Promise<CreateResult> {
  const actor = await requireRole('ADMINISTRATEUR', 'CHEF_ARMEMENT');
  if (!name.trim()) return { ok: false, error: 'Nom requis.' };
  const data = { companyId: actor.companyId, name };

  let id: string;
  switch (kind) {
    case 'PILOT':
      id = (await prisma.pilot.create({ data })).id;
      break;
    case 'MOVEMENT_TYPE':
      id = (await prisma.movementType.create({ data })).id;
      break;
    case 'CERTIFICATE_TYPE':
      id = (await prisma.certificateType.create({ data })).id;
      break;
    case 'EXERCISE_TYPE':
      id = (await prisma.exerciseType.create({ data })).id;
      break;
    case 'MAINTENANCE_EQUIPMENT_TYPE':
      id = (await prisma.maintenanceEquipmentType.create({ data })).id;
      break;
    case 'TUG_TYPE':
      id = (await prisma.tugType.create({ data })).id;
      break;
  }

  revalidatePath('/administration/referentiels');
  return { ok: true, id };
}

export async function toggleReferentielArchived(kind: RefKind, id: string, isArchived: boolean): Promise<ActionResult> {
  await requireRole('ADMINISTRATEUR', 'CHEF_ARMEMENT');
  const data = { isArchived };

  switch (kind) {
    case 'PILOT':
      await prisma.pilot.update({ where: { id }, data });
      break;
    case 'MOVEMENT_TYPE':
      await prisma.movementType.update({ where: { id }, data });
      break;
    case 'CERTIFICATE_TYPE':
      await prisma.certificateType.update({ where: { id }, data });
      break;
    case 'EXERCISE_TYPE':
      await prisma.exerciseType.update({ where: { id }, data });
      break;
    case 'MAINTENANCE_EQUIPMENT_TYPE':
      await prisma.maintenanceEquipmentType.update({ where: { id }, data });
      break;
    case 'TUG_TYPE':
      await prisma.tugType.update({ where: { id }, data });
      break;
  }

  revalidatePath('/administration/referentiels');
  return { ok: true };
}
