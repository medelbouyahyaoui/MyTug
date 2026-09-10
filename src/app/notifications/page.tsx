import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { getNotifications } from '@/lib/notifications/actions';
import { NotificationsView } from './notifications-view';

export const dynamic = 'force-dynamic';

const ROLE_LABEL: Record<string, string> = {
  ADMINISTRATEUR: 'Administrateur',
  CHEF_ARMEMENT: "Chef d'armement",
  CHEF_MECANICIEN: 'Chef mécanicien',
  CAPITAINE: 'Capitaine',
  DISPATCHER: 'Dispatcher',
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  const { notifications } = await getNotifications();

  return (
    <div className="flex flex-1">
      <aside className="w-60 shrink-0 border-r border-slate-200 bg-slate-50 p-4">
        <Link href="/tableau-de-bord" className="mb-6 flex items-center gap-2 px-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white">
            MT
          </span>
          <span className="text-sm font-semibold">MyTug</span>
        </Link>

        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Navigation</p>
        <nav className="flex flex-col gap-0.5">
          <Link href="/flotte" className="rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
            Flotte
          </Link>
          {(user.role === 'ADMINISTRATEUR' || user.role === 'CHEF_ARMEMENT' || user.role === 'DISPATCHER') && (
            <Link href="/disponibilite" className="rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
              Disponibilité
            </Link>
          )}
          <Link href="/missions" className="rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
            Missions
          </Link>
          <Link href="/documents" className="rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
            Documents
          </Link>
          <Link href="/notifications" className="rounded-md bg-slate-100 px-2 py-1.5 text-sm font-medium text-slate-900">
            Notifications
          </Link>
          {(user.role === 'ADMINISTRATEUR' || user.role === 'CHEF_ARMEMENT' || user.role === 'CHEF_MECANICIEN') && (
            <Link href="/rapports" className="rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
              Rapports
            </Link>
          )}
          {(user.role === 'ADMINISTRATEUR' || user.role === 'CHEF_ARMEMENT') && (
            <Link href="/historique" className="rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
              Historique
            </Link>
          )}
          {(user.role === 'ADMINISTRATEUR' || user.role === 'CHEF_ARMEMENT') && (
            <Link href="/administration/utilisateurs" className="rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
              Administration
            </Link>
          )}
        </nav>

        <div className="mt-6 border-t border-slate-200 px-2 pt-4 text-xs text-slate-400">
          {user.firstName} {user.lastName}
          <br />
          {ROLE_LABEL[user.role] ?? user.role}
        </div>
      </aside>

      <div className="flex-1">
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
          <h1 className="text-lg font-semibold">
            Notifications <span className="font-normal text-slate-400">· alertes et échéances</span>
          </h1>
        </div>

        <NotificationsView notifications={notifications} />
      </div>
    </div>
  );
}
