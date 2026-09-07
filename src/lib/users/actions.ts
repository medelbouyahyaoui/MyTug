'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/session';
import { hashSecret } from '@/lib/auth/hash';
import type { UserRole } from '@prisma/client';

export type ActionResult = { ok: true } | { ok: false; error: string };

const OFFICE_ROLES: UserRole[] = ['ADMINISTRATEUR', 'CHEF_ARMEMENT', 'DISPATCHER'];
const PIN_ROLES: UserRole[] = ['CAPITAINE', 'CHEF_MECANICIEN'];

export async function listUsers() {
  const actor = await requireRole('ADMINISTRATEUR', 'CHEF_ARMEMENT');
  return prisma.user.findMany({
    where: { companyId: actor.companyId },
    orderBy: [{ status: 'asc' }, { lastName: 'asc' }],
  });
}

export async function getUser(id: string) {
  const actor = await requireRole('ADMINISTRATEUR', 'CHEF_ARMEMENT');
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.companyId !== actor.companyId) return null;

  const assignments = await prisma.postAssignment.findMany({
    where: { userId: id },
    include: { tug: true, poste: true },
    orderBy: { startsAt: 'desc' },
    take: 20,
  });

  return { user, assignments };
}

export async function createUser(input: {
  firstName: string;
  lastName: string;
  role: UserRole;
  email?: string;
  password?: string;
  pin?: string;
}): Promise<ActionResult> {
  const actor = await requireRole('ADMINISTRATEUR', 'CHEF_ARMEMENT');

  if (!input.firstName.trim() || !input.lastName.trim()) {
    return { ok: false, error: 'Le prénom et le nom sont obligatoires.' };
  }

  const data: Parameters<typeof prisma.user.create>[0]['data'] = {
    companyId: actor.companyId,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    role: input.role,
  };

  if (OFFICE_ROLES.includes(input.role)) {
    if (!input.email?.trim() || !input.password) {
      return { ok: false, error: 'Email et mot de passe requis pour ce rôle.' };
    }
    data.email = input.email.trim().toLowerCase();
    data.passwordHash = await hashSecret(input.password);
  } else if (PIN_ROLES.includes(input.role)) {
    if (!input.pin || !/^\d{4,6}$/.test(input.pin)) {
      return { ok: false, error: 'Code PIN requis (4 à 6 chiffres).' };
    }
    data.pinHash = await hashSecret(input.pin);
  }

  try {
    await prisma.user.create({ data });
  } catch (e: unknown) {
    if (typeof e === 'object' && e !== null && 'code' in e && e.code === 'P2002') {
      return { ok: false, error: 'Cette adresse e-mail est déjà utilisée.' };
    }
    throw e;
  }

  revalidatePath('/administration/utilisateurs');
  return { ok: true };
}

export async function updateUser(
  id: string,
  input: { firstName: string; lastName: string; role: UserRole }
): Promise<ActionResult> {
  const actor = await requireRole('ADMINISTRATEUR', 'CHEF_ARMEMENT');
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || existing.companyId !== actor.companyId) {
    return { ok: false, error: 'Utilisateur introuvable.' };
  }

  await prisma.user.update({
    where: { id },
    data: { firstName: input.firstName.trim(), lastName: input.lastName.trim(), role: input.role },
  });

  revalidatePath('/administration/utilisateurs');
  revalidatePath(`/administration/utilisateurs/${id}`);
  return { ok: true };
}

export async function resetPassword(id: string, password: string): Promise<ActionResult> {
  const actor = await requireRole('ADMINISTRATEUR', 'CHEF_ARMEMENT');
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || existing.companyId !== actor.companyId) return { ok: false, error: 'Introuvable.' };
  if (password.length < 8) return { ok: false, error: '8 caractères minimum.' };

  await prisma.user.update({ where: { id }, data: { passwordHash: await hashSecret(password) } });
  return { ok: true };
}

export async function resetPin(id: string, pin: string): Promise<ActionResult> {
  const actor = await requireRole('ADMINISTRATEUR', 'CHEF_ARMEMENT');
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || existing.companyId !== actor.companyId) return { ok: false, error: 'Introuvable.' };
  if (!/^\d{4,6}$/.test(pin)) return { ok: false, error: '4 à 6 chiffres.' };

  await prisma.user.update({ where: { id }, data: { pinHash: await hashSecret(pin) } });
  return { ok: true };
}

/** Départ d'un utilisateur : désactivation, jamais de suppression en cascade. */
export async function archiveUser(id: string): Promise<ActionResult> {
  const actor = await requireRole('ADMINISTRATEUR', 'CHEF_ARMEMENT');
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || existing.companyId !== actor.companyId) return { ok: false, error: 'Introuvable.' };

  await prisma.user.update({ where: { id }, data: { status: 'ARCHIVE' } });
  await prisma.session.deleteMany({ where: { userId: id } }); // révoque les sessions actives
  revalidatePath('/administration/utilisateurs');
  return { ok: true };
}

export async function reactivateUser(id: string): Promise<ActionResult> {
  const actor = await requireRole('ADMINISTRATEUR', 'CHEF_ARMEMENT');
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || existing.companyId !== actor.companyId) return { ok: false, error: 'Introuvable.' };

  await prisma.user.update({ where: { id }, data: { status: 'ACTIF' } });
  revalidatePath('/administration/utilisateurs');
  return { ok: true };
}

/** Suppression possible uniquement après archivage — les références
 * historiques (missions, services...) restent conservées via les clés
 * étrangères, jamais de suppression en cascade. */
export async function deleteUser(id: string): Promise<ActionResult> {
  const actor = await requireRole('ADMINISTRATEUR', 'CHEF_ARMEMENT');
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || existing.companyId !== actor.companyId) return { ok: false, error: 'Introuvable.' };
  if (existing.status !== 'ARCHIVE') {
    return { ok: false, error: "Seul un compte archivé peut être supprimé." };
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch {
    return {
      ok: false,
      error: 'Ce compte est référencé par des données historiques et ne peut pas être supprimé.',
    };
  }

  revalidatePath('/administration/utilisateurs');
  return { ok: true };
}
