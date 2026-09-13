import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { getCurrentUser } from '@/lib/auth/session';
import { getUnreadNotificationCount } from '@/lib/notifications/actions';
import { IconAdmin, IconAvailability, IconDocuments, IconFleet, IconHistory, IconMissions, IconNotifications, IconReports } from '@/components/nav-icons';

const ROLE_LABEL: Record<string, string> = {
  ADMINISTRATEUR: 'Administrateur',
  CHEF_ARMEMENT: "Chef d'armement",
  CHEF_MECANICIEN: 'Chef mécanicien',
  CAPITAINE: 'Capitaine',
  DISPATCHER: 'Dispatcher',
};

export default async function DocumentsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  const canManage = user.role === 'ADMINISTRATEUR' || user.role === 'CHEF_ARMEMENT';
  const unreadCount = await getUnreadNotificationCount();

  return (
    <div className="flex flex-1">
      <aside className="w-60 shrink-0 border-r border-slate-200 bg-slate-50 p-4">
        <Link href="/tableau-de-bord" className="mb-6 flex items-center gap-2 px-2">
          <Logo className="h-7 w-7 text-slate-900" />
          <span className="text-sm font-semibold">MyTug</span>
        </Link>

        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Navigation
        </p>
        <nav className="flex flex-col gap-0.5">
          <Link href="/flotte" className="rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100 flex items-center gap-2">
            <IconFleet className="h-4 w-4 shrink-0" />
            Flotte
          </Link>
          {(canManage || user.role === 'DISPATCHER') && (
            <Link href="/disponibilite" className="rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100 flex items-center gap-2">
            <IconAvailability className="h-4 w-4 shrink-0" />
            Disponibilité
          </Link>
          )}
          <Link href="/missions" className="rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100 flex items-center gap-2">
            <IconMissions className="h-4 w-4 shrink-0" />
            Missions
          </Link>
          <Link
            href="/documents"
            className="rounded-md bg-slate-100 px-2 py-1.5 text-sm font-medium text-slate-900 flex items-center gap-2"
          >
            <IconDocuments className="h-4 w-4 shrink-0" />
            Documents
          </Link>
          <Link href="/notifications" className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
            <span className="flex items-center gap-2"><IconNotifications className="h-4 w-4 shrink-0" />Notifications</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">{unreadCount}</span>
            )}
          </Link>
          {(canManage || user.role === 'CHEF_MECANICIEN') && (
            <Link href="/rapports" className="rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100 flex items-center gap-2">
            <IconReports className="h-4 w-4 shrink-0" />
            Rapports
          </Link>
          )}
          {canManage && (
            <Link href="/historique" className="rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100 flex items-center gap-2">
            <IconHistory className="h-4 w-4 shrink-0" />
            Historique
          </Link>
          )}
          {canManage && (
            <Link
              href="/administration/utilisateurs"
              className="rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100 flex items-center gap-2"
            >
            <IconAdmin className="h-4 w-4 shrink-0" />
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

      <div className="flex-1">{children}</div>
    </div>
  );
}
