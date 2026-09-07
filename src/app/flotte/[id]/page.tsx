import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTug } from '@/lib/tugs/actions';
import { getCurrentUser } from '@/lib/auth/session';
import { TugSpecsForm } from './tug-specs-form';
import { TugStatusPanel } from './tug-status-panel';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  OCCUPE: 'Occupé',
  MAINTENANCE: 'Maintenance',
  DESARME: 'Désarmé',
  ACTIVE_TEMPORAIREMENT: 'Activé temporairement',
  INDISPONIBLE: 'Indisponible',
};

export default async function FicheRemorqueurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getTug(id);
  if (!data) notFound();
  const { tug, statusHistory } = data;

  const user = await getCurrentUser();
  const canEditSpecs = user?.role === 'ADMINISTRATEUR' || user?.role === 'CHEF_ARMEMENT';
  const canChangeStatus =
    user?.role === 'ADMINISTRATEUR' || user?.role === 'CHEF_ARMEMENT' || user?.role === 'CHEF_MECANICIEN';

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/flotte" className="text-slate-400 hover:text-slate-600">
            ←
          </Link>
          <h1 className="text-lg font-semibold">
            {tug.name} <span className="font-normal text-slate-400">· {tug.tugType.name}</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/flotte/${tug.id}/equipage`}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Équipage →
          </Link>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            {STATUS_LABEL[tug.status] ?? tug.status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <TugSpecsForm tug={tug} readOnly={!canEditSpecs} />
        {canChangeStatus && <TugStatusPanel tugId={tug.id} currentStatus={tug.status} />}
      </div>

      <div className="px-6 pb-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold">Historique des statuts</h2>
          {statusHistory.length === 0 && (
            <p className="text-sm text-slate-400">Aucun changement enregistré.</p>
          )}
          <ul className="space-y-3">
            {statusHistory.map((h) => (
              <li key={h.id} className="border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{STATUS_LABEL[h.status] ?? h.status}</span>
                  <span className="font-mono text-xs text-slate-400">
                    {h.createdAt.toLocaleString('fr-FR')}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Par {h.changedBy.firstName} {h.changedBy.lastName}
                  {h.reason ? ` — ${h.reason}` : ''}
                </p>
                {h.temporaryActivationStart && h.temporaryActivationEnd && (
                  <p className="mt-0.5 text-xs text-slate-400">
                    Période : {h.temporaryActivationStart.toLocaleDateString('fr-FR')} →{' '}
                    {h.temporaryActivationEnd.toLocaleDateString('fr-FR')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
