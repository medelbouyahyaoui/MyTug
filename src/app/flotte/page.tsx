import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { listTugs } from '@/lib/tugs/actions';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  OCCUPE: 'Occupé',
  MAINTENANCE: 'Maintenance',
  DESARME: 'Désarmé',
  ACTIVE_TEMPORAIREMENT: 'Activé temporairement',
  INDISPONIBLE: 'Indisponible',
};

const STATUS_STYLE: Record<string, string> = {
  DISPONIBLE: 'bg-emerald-50 text-emerald-700',
  OCCUPE: 'bg-sky-50 text-sky-700',
  MAINTENANCE: 'bg-amber-50 text-amber-700',
  DESARME: 'bg-slate-100 text-slate-500',
  ACTIVE_TEMPORAIREMENT: 'bg-purple-50 text-purple-700',
  INDISPONIBLE: 'bg-red-50 text-red-700',
};

export default async function FlottePage() {
  const user = await getCurrentUser();
  const tugs = await listTugs();
  const canManage = user?.role === 'ADMINISTRATEUR' || user?.role === 'CHEF_ARMEMENT';

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h1 className="text-lg font-semibold">Flotte</h1>
        {canManage && (
          <Link
            href="/flotte/nouveau"
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            + Ajouter un remorqueur
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {tugs.map((tug) => (
          <Link
            key={tug.id}
            href={`/flotte/${tug.id}`}
            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{tug.name}</p>
                <p className="text-xs uppercase tracking-wide text-slate-400">{tug.tugType.name}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[tug.status]}`}
              >
                {STATUS_LABEL[tug.status] ?? tug.status}
              </span>
            </div>
          </Link>
        ))}
        {tugs.length === 0 && (
          <p className="col-span-full text-sm text-slate-400">Aucun remorqueur enregistré.</p>
        )}
      </div>
    </div>
  );
}
