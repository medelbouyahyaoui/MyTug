import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { getUnreadNotificationCount } from '@/lib/notifications/actions';
import { getHistoryEvents, type HistoryEventType } from '@/lib/history/actions';

export const dynamic = 'force-dynamic';

const ROLE_LABEL: Record<string, string> = {
  ADMINISTRATEUR: 'Administrateur',
  CHEF_ARMEMENT: "Chef d'armement",
};

const TYPE_LABEL: Record<HistoryEventType, string> = {
  CONFIG: 'Configuration',
  TUG_STATUS: 'Statuts remorqueur',
  CREW: 'Équipages',
  CONTESTATION: 'Contestations',
  DOCUMENT: 'Documents',
};

const TYPE_CLASS: Record<HistoryEventType, string> = {
  CONFIG: 'bg-purple-100 text-purple-700',
  TUG_STATUS: 'bg-sky-100 text-sky-700',
  CREW: 'bg-emerald-100 text-emerald-700',
  CONTESTATION: 'bg-amber-100 text-amber-700',
  DOCUMENT: 'bg-slate-100 text-slate-600',
};

const ALL_TYPES = Object.keys(TYPE_LABEL) as HistoryEventType[];

export default async function HistoriquePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; type?: string | string[] }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (user.role !== 'ADMINISTRATEUR' && user.role !== 'CHEF_ARMEMENT') redirect('/tableau-de-bord');

  const params = await searchParams;
  const selectedTypes = params.type ? (Array.isArray(params.type) ? params.type : [params.type]) as HistoryEventType[] : ALL_TYPES;

  const [events, unreadCount] = await Promise.all([
    getHistoryEvents({ from: params.from, to: params.to, types: selectedTypes }),
    getUnreadNotificationCount(),
  ]);

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
          <Link href="/rapports" className="rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
            Rapports
          </Link>
          <Link href="/historique" className="rounded-md bg-slate-100 px-2 py-1.5 text-sm font-medium text-slate-900">
            Historique
          </Link>
          <Link href="/administration/utilisateurs" className="rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
            Administration
          </Link>
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
            Historique <span className="font-normal text-slate-400">· traçabilité, conservée indéfiniment</span>
          </h1>
        </div>

        <div className="p-6">
          <div className="mx-auto max-w-4xl">
            <form method="get" className="flex flex-wrap items-end gap-4 rounded-lg border border-slate-200 bg-white p-4">
              <div>
                <label className="block text-xs font-medium text-slate-500">Du</label>
                <input type="date" name="from" defaultValue={params.from} className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">Au</label>
                <input type="date" name="to" defaultValue={params.to} className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
              </div>
              <div className="flex flex-wrap gap-3">
                {ALL_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" name="type" value={t} defaultChecked={selectedTypes.includes(t)} />
                    {TYPE_LABEL[t]}
                  </label>
                ))}
              </div>
              <button type="submit" className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800">
                Filtrer
              </button>
            </form>

            {events.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">Aucun événement pour ces filtres.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {events.map((e, i) => (
                  <li key={i} className="rounded-lg border border-slate-100 bg-white p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_CLASS[e.type]}`}>{TYPE_LABEL[e.type]}</span>
                      <span className="ml-auto font-mono text-xs text-slate-400">{e.date.toLocaleString('fr-FR')}</span>
                    </div>
                    <p className="mt-1">{e.description}</p>
                    <p className="mt-0.5 text-xs text-slate-400">Par {e.actor}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
