import Link from 'next/link';
import type { getChefArmementDashboard } from '@/lib/dashboard/actions';

type Data = Awaited<ReturnType<typeof getChefArmementDashboard>>;

const STATUS_LABEL: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  DISPONIBLE_SANS_EQUIPAGE: 'Disponible sans équipage',
  OCCUPE: 'Occupé',
  MAINTENANCE: 'Maintenance',
  DESARME: 'Désarmé',
  ACTIVE_TEMPORAIREMENT: 'Activé temporairement',
  INDISPONIBLE: 'Indisponible',
};
const STATUS_CLASS: Record<string, string> = {
  DISPONIBLE: 'bg-emerald-100 text-emerald-700',
  DISPONIBLE_SANS_EQUIPAGE: 'bg-amber-100 text-amber-700',
  OCCUPE: 'bg-sky-100 text-sky-700',
  MAINTENANCE: 'bg-orange-100 text-orange-700',
  DESARME: 'bg-slate-100 text-slate-500',
  ACTIVE_TEMPORAIREMENT: 'bg-purple-100 text-purple-700',
  INDISPONIBLE: 'bg-red-100 text-red-700',
};

function fmtDate(dt: Date | string) {
  return new Date(dt).toLocaleDateString('fr-FR');
}

export function ChefArmementDashboard({ data }: { data: Data }) {
  const { availability, recentMissions, notifications, maintenanceDue, expiringCertificates, pendingExercises, pendingSafety } = data;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Flotte & disponibilité" className="md:col-span-2">
        <div className="flex flex-wrap gap-2">
          {availability.map((row) => (
            <Link
              key={row.tug.id}
              href={`/flotte/${row.tug.id}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_CLASS[row.derivedStatus]}`}
            >
              {row.tug.name} — {STATUS_LABEL[row.derivedStatus]}
            </Link>
          ))}
        </div>
        <Link href="/disponibilite" className="mt-2 inline-block text-xs font-medium text-sky-600 hover:text-sky-700">
          Voir le tableau de disponibilité →
        </Link>
      </Card>

      <Card title="Missions récentes">
        {recentMissions.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune mission.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {recentMissions.map((m) => (
              <li key={m.id} className="flex justify-between border-b border-slate-100 py-1 last:border-0">
                <span>
                  {m.tug.name} — {m.vesselName}
                </span>
                <span className="text-xs text-slate-400">
                  {fmtDate(m.departureFromDockAt)} · {m.status}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/missions" className="mt-2 inline-block text-xs font-medium text-sky-600 hover:text-sky-700">
          Toutes les missions →
        </Link>
      </Card>

      <Card title={`Sécurité — à valider${pendingSafety.length > 0 ? ` (${pendingSafety.length})` : ''}`}>
        {pendingSafety.length === 0 ? (
          <p className="text-sm text-slate-400">Rien en attente.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {pendingSafety.map((o) => (
              <li key={o.id}>
                <Link href={`/flotte/${o.tug.id}/securite`} className="text-sky-600 hover:text-sky-700">
                  {o.tug.name} — {o.description.slice(0, 60)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={`Maintenance à surveiller${maintenanceDue.length > 0 ? ` (${maintenanceDue.length})` : ''}`}>
        {maintenanceDue.length === 0 ? (
          <p className="text-sm text-slate-400">Rien à signaler.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {maintenanceDue.map((p) => (
              <li key={p.id}>
                <Link href={`/flotte/${p.tug.id}/maintenance`} className="text-sky-600 hover:text-sky-700">
                  {p.tug.name} — {p.engine?.label ?? '—'}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={`Certificats à renouveler${expiringCertificates.length > 0 ? ` (${expiringCertificates.length})` : ''}`}>
        {expiringCertificates.length === 0 ? (
          <p className="text-sm text-slate-400">Rien à signaler.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {expiringCertificates.map((c) => (
              <li key={c.id}>
                <Link href={`/flotte/${c.tug.id}/certificats-exercices`} className="text-sky-600 hover:text-sky-700">
                  {c.tug.name} — {c.type.name} (expire le {c.expiresAt ? fmtDate(c.expiresAt) : '—'})
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={`Exercices en attente${pendingExercises.length > 0 ? ` (${pendingExercises.length})` : ''}`}>
        {pendingExercises.length === 0 ? (
          <p className="text-sm text-slate-400">Rien à signaler.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {pendingExercises.map((e) => (
              <li key={e.id}>
                <Link href={`/flotte/${e.tug.id}/certificats-exercices`} className="text-sky-600 hover:text-sky-700">
                  {e.tug.name} — {e.type.name} — {e.captain.firstName} {e.captain.lastName}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={`Notifications${notifications.length > 0 ? ` (${notifications.length})` : ''}`}>
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-400">Rien à signaler.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link href="/notifications" className="text-sky-600 hover:text-sky-700">
                  {n.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 text-left ${className ?? ''}`}>
      <p className="mb-2 text-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}
