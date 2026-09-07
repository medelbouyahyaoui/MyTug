import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { getUnreadNotificationCount } from '@/lib/notifications/actions';
import { getAvailableReports, getReportTugs } from '@/lib/reports/actions';
import { ReportsView } from './reports-view';

export const dynamic = 'force-dynamic';

const ROLE_LABEL: Record<string, string> = {
  ADMINISTRATEUR: 'Administrateur',
  CHEF_ARMEMENT: "Chef d'armement",
  CHEF_MECANICIEN: 'Chef mécanicien',
  CAPITAINE: 'Capitaine',
  DISPATCHER: 'Dispatcher',
};

export default async function RapportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  const [reports, tugs, unreadCount] = await Promise.all([getAvailableReports(), getReportTugs(), getUnreadNotificationCount()]);

  if (reports.length === 0) redirect('/tableau-de-bord');

  const canManage = user.role === 'ADMINISTRATEUR' || user.role === 'CHEF_ARMEMENT';

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
          <Link href="/missions" className="rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
            Missions
          </Link>
          <Link href="/documents" className="rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
            Documents
          </Link>
          <Link href="/notifications" className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
            Notifications
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">{unreadCount}</span>
            )}
          </Link>
          <Link href="/rapports" className="rounded-md bg-slate-100 px-2 py-1.5 text-sm font-medium text-slate-900">
            Rapports
          </Link>
          {canManage && (
            <Link href="/historique" className="rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
              Historique
            </Link>
          )}
          {canManage && (
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
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4 print:hidden">
          <h1 className="text-lg font-semibold">
            Rapports <span className="font-normal text-slate-400">· génération à la demande</span>
          </h1>
        </div>

        <ReportsView reports={reports} tugs={tugs} />
      </div>
    </div>
  );
}
