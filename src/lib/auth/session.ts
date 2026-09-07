import 'server-only';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import type { UserRole } from '@prisma/client';

const SESSION_COOKIE = 'mytug_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12; // 12h — couvre un service de tablette

export async function createSession(userId: string, tugId?: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const session = await prisma.session.create({
    data: { userId, tugId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return session;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {
      // déjà supprimée / expirée — rien à faire
    });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export type CurrentUser = {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tugId: string | null; // remorqueur de la session en cours, pour les rôles PIN
};

/**
 * Lit la session en cours à partir du cookie. Retourne null si absente,
 * expirée, ou si le compte a été désactivé entre-temps (révocation
 * immédiate — cohérent avec l'exigence de traçabilité du projet).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  if (session.user.status !== 'ACTIF') return null;

  return {
    id: session.user.id,
    companyId: session.user.companyId,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    role: session.user.role,
    tugId: session.tugId,
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHENTICATED');
  return user;
}

export async function requireRole(...roles: UserRole[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new Error('FORBIDDEN');
  return user;
}
