'use server';

import { prisma } from '@/lib/prisma';
import { hashSecret, verifySecret } from '@/lib/auth/hash';
import { createSession, destroySession } from '@/lib/auth/session';
import { takeService } from '@/lib/service/pickup';

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Connexion bureau — Administrateur, Chef d'armement, Dispatcher.
 */
export async function loginWithPassword(email: string, password: string): Promise<ActionResult> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.status !== 'ACTIF') {
    return { ok: false, error: 'Identifiants incorrects.' };
  }
  if (!['ADMINISTRATEUR', 'CHEF_ARMEMENT', 'DISPATCHER'].includes(user.role)) {
    return { ok: false, error: "Ce compte n'utilise pas la connexion par mot de passe." };
  }

  const valid = await verifySecret(password, user.passwordHash);
  if (!valid) {
    return { ok: false, error: 'Identifiants incorrects.' };
  }

  await createSession(user.id);
  return { ok: true };
}

/**
 * Liste des personnes pouvant s'identifier sur la tablette d'un remorqueur
 * (Capitaine, Chef mécanicien) — affectation flexible, donc tous les actifs
 * de la compagnie, pas seulement l'historique de ce remorqueur précis.
 */
export async function listKioskUsers(companyId: string) {
  return prisma.user.findMany({
    where: {
      companyId,
      status: 'ACTIF',
      role: { in: ['CAPITAINE', 'CHEF_MECANICIEN'] },
    },
    select: { id: true, firstName: true, lastName: true, role: true },
    orderBy: [{ role: 'asc' }, { lastName: 'asc' }],
  });
}

/**
 * Connexion tablette — Capitaine ou Chef mécanicien, par code PIN, sur un
 * remorqueur donné.
 */
export async function loginWithPin(userId: string, pin: string, tugId: string): Promise<ActionResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.status !== 'ACTIF') {
    return { ok: false, error: 'Compte introuvable.' };
  }
  if (!['CAPITAINE', 'CHEF_MECANICIEN'].includes(user.role)) {
    return { ok: false, error: "Ce compte n'utilise pas le code PIN." };
  }

  const valid = await verifySecret(pin, user.pinHash);
  if (!valid) {
    return { ok: false, error: 'Code PIN incorrect.' };
  }

  await createSession(user.id, tugId);
  await takeService(user.id, tugId, user.companyId);
  return { ok: true };
}

export async function logout(): Promise<void> {
  await destroySession();
}

/** Utilitaires internes réservés aux scripts d'amorçage (seed, admin). */
export async function hashPassword(password: string) {
  return hashSecret(password);
}
export async function hashPin(pin: string) {
  return hashSecret(pin);
}
