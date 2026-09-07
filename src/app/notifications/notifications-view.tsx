'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { markNotificationRead, markAllNotificationsRead } from '@/lib/notifications/actions';
import type { Notification } from '@prisma/client';

const SEVERITY_CLASS: Record<string, string> = {
  INFO: 'bg-slate-100 text-slate-600',
  WARNING: 'bg-amber-100 text-amber-700',
  CRITICAL: 'bg-red-100 text-red-700',
};
const SEVERITY_LABEL: Record<string, string> = { INFO: 'Info', WARNING: 'Attention', CRITICAL: 'Critique' };

function fmtDateTime(dt: Date | string) {
  return new Date(dt).toLocaleString('fr-FR');
}

export function NotificationsView({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function markRead(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      router.refresh();
    });
  }

  function markAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est lu'}
          </p>
          {unreadCount > 0 && (
            <button onClick={markAllRead} disabled={isPending} className="text-xs font-medium text-sky-600 hover:text-sky-700 disabled:opacity-50">
              Tout marquer comme lu
            </button>
          )}
        </div>

        {notifications.length === 0 && <p className="mt-4 text-sm text-slate-400">Aucune notification.</p>}

        <ul className="mt-4 space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`rounded-lg border p-3 text-sm ${n.isRead ? 'border-slate-100 bg-white' : 'border-slate-200 bg-slate-50'}`}
            >
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_CLASS[n.severity]}`}>{SEVERITY_LABEL[n.severity]}</span>
                <span className={`font-medium ${n.isRead ? 'text-slate-600' : 'text-slate-900'}`}>{n.title}</span>
                <span className="ml-auto font-mono text-xs text-slate-400">{fmtDateTime(n.createdAt)}</span>
              </div>
              {n.detail && <p className="mt-1 text-slate-500">{n.detail}</p>}
              <div className="mt-1.5 flex items-center gap-3">
                {n.linkUrl && (
                  <Link href={n.linkUrl} className="text-xs font-medium text-sky-600 hover:text-sky-700">
                    Voir →
                  </Link>
                )}
                {!n.isRead && (
                  <button onClick={() => markRead(n.id)} disabled={isPending} className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-50">
                    Marquer comme lu
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
