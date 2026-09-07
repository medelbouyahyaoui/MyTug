'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/session';
import { scanCompanyNotifications } from './scan';

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function getNotifications() {
  const actor = await requireUser();
  await scanCompanyNotifications(actor.companyId);

  const notifications = await prisma.notification.findMany({
    where: { userId: actor.id },
    orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
    take: 100,
  });

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.isRead).length,
  };
}

export async function getUnreadNotificationCount(): Promise<number> {
  const actor = await requireUser();
  await scanCompanyNotifications(actor.companyId);
  return prisma.notification.count({ where: { userId: actor.id, isRead: false } });
}

export async function markNotificationRead(id: string): Promise<ActionResult> {
  const actor = await requireUser();
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== actor.id) return { ok: false, error: 'Notification introuvable.' };

  await prisma.notification.update({ where: { id }, data: { isRead: true } });
  revalidatePath('/notifications');
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const actor = await requireUser();
  await prisma.notification.updateMany({ where: { userId: actor.id, isRead: false }, data: { isRead: true } });
  revalidatePath('/notifications');
  return { ok: true };
}
