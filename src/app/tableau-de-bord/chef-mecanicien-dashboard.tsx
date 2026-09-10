import Link from 'next/link';
import type { getChefMecanicienDashboard } from '@/lib/dashboard/actions';

type Data = Awaited<ReturnType<typeof getChefMecanicienDashboard>>;

function fmtDateTime(dt: Date | string) {
  return new Date(dt).toLocaleString('fr-FR');
}

export function ChefMecanicienDashboard({ data }: { data: Data }) {
  const { machine, upcoming, overdue, correctiveInterventions, notifications } = data;
  const tugId = machine.tug.id;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title={`Maintenance en retard${overdue.length > 0 ? ` (${overdue.length})` : ''}`}>
        {overdue.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {overdue.map((p) => (
              <li key={p.id}>{p.engine?.label ?? p.equipmentType?.name ?? p.equipmentFreeText ?? '—'}</li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={`Maintenance à venir${upcoming.length > 0 ? ` (${upcoming.length})` : ''}`}>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {upcoming.map((p) => (
              <li key={p.id}>{p.engine?.label ?? p.equipmentType?.name ?? p.equipmentFreeText ?? '—'}</li>
            ))}
          </ul>
        )}
        <Link href={`/flotte/${tugId}/maintenance`} className="mt-2 inline-block text-xs font-medium text-sky-600 hover:text-sky-700">
          Voir la maintenance →
        </Link>
      </Card>

      <Card title="Carburant & huile">
        <p className="text-sm">Carburant : {machine.currentFuelLevel != null ? `${machine.currentFuelLevel} t` : '—'}</p>
        <p className="text-sm">Huile : {machine.currentOilLevel != null ? `${machine.currentOilLevel} L` : '—'}</p>
        {machine.fuelAlert && <p className="mt-1 text-xs font-medium text-red-600">Seuil d&apos;alerte carburant franchi</p>}
        <Link href={`/flotte/${tugId}/machine`} className="mt-2 inline-block text-xs font-medium text-sky-600 hover:text-sky-700">
          Journal machine →
        </Link>
      </Card>

      <Card title="Heures moteur">
        <ul className="space-y-0.5 text-sm">
          {machine.engines.map((e) => (
            <li key={e.id}>
              {e.label} : {e.currentHours.toLocaleString('fr-FR')} h
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Interventions correctives récentes">
        {correctiveInterventions.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {correctiveInterventions.map((i) => (
              <li key={i.id} className="flex justify-between">
                <span>{i.description ?? i.plan?.engine?.label ?? '—'}</span>
                <span className="text-xs text-slate-400">{fmtDateTime(i.occurredAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={`Alertes${notifications.length > 0 ? ` (${notifications.length})` : ''}`}>
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

      <Card title="Journal machine — dernières entrées" className="md:col-span-2">
        {machine.logEntries.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune entrée.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {machine.logEntries.slice(0, 5).map((e) => (
              <li key={e.id} className="flex justify-between border-b border-slate-100 py-1 last:border-0">
                <span>
                  {e.state} — {e.observation}
                </span>
                <span className="text-xs text-slate-400">{fmtDateTime(e.createdAt)}</span>
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
