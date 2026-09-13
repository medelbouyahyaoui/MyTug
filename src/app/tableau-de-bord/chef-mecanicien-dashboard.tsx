import Link from 'next/link';
import type { getChefMecanicienDashboard } from '@/lib/dashboard/actions';
import { RadialGauge } from '@/components/radial-gauge';
import { ZelligePattern } from '@/components/zellige-pattern';
import { DarkCard } from '@/components/dark-card';

type Data = Awaited<ReturnType<typeof getChefMecanicienDashboard>>;

function fmtDateTime(dt: Date | string) {
  return new Date(dt).toLocaleString('fr-FR');
}

const STATE_LABEL: Record<string, string> = { NORMAL: 'Normal', A_SURVEILLER: 'À surveiller', PANNE: 'Panne' };
const STATE_DOT: Record<string, string> = { NORMAL: 'bg-emerald-400', A_SURVEILLER: 'bg-amber-400', PANNE: 'bg-red-400' };
const STATE_BADGE: Record<string, string> = {
  NORMAL: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  A_SURVEILLER: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  PANNE: 'bg-red-400/15 text-red-300 border-red-400/30',
};

export function ChefMecanicienDashboard({ data }: { data: Data }) {
  const { machine, plans, upcoming, overdue, correctiveInterventions, notifications } = data;
  const tugId = machine.tug.id;

  const wearGauges = plans
    .filter((p) => p.engine && p.intervalHours != null && p.remainingHours != null)
    .map((p) => ({
      id: p.id,
      label: p.engine!.label,
      wearPct: 100 - (p.remainingHours! / p.intervalHours!) * 100,
      urgency: p.urgency,
    }));

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 text-slate-100">
      <ZelligePattern className="pointer-events-none absolute inset-0 h-full w-full text-amber-300" />

      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">Salle des machines</p>
            <h2 className="font-serif text-2xl text-white">{machine.tug.name}</h2>
          </div>
          {machine.latestState && (
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STATE_BADGE[machine.latestState]}`}>
              État machine : {STATE_LABEL[machine.latestState]}
            </span>
          )}
        </div>

        {/* Jauges — données réelles uniquement (pas de RPM/température, non modélisés) */}
        <div className="mt-6 flex flex-wrap gap-8 rounded-xl bg-white/5 p-5">
          {machine.fuelPct != null && (
            <RadialGauge value={machine.fuelPct} label="Carburant" colorClass={machine.fuelAlert ? 'text-red-400' : 'text-amber-400'} />
          )}
          {machine.oilPct != null && <RadialGauge value={machine.oilPct} label="Huile" colorClass="text-sky-400" />}
          {wearGauges.map((g) => (
            <RadialGauge
              key={g.id}
              value={g.wearPct}
              label={`${g.label} — usure`}
              colorClass={g.urgency === 'ECHU' ? 'text-red-400' : g.urgency === 'BIENTOT' ? 'text-amber-400' : 'text-emerald-400'}
            />
          ))}
          {machine.fuelPct == null && machine.oilPct == null && wearGauges.length === 0 && (
            <p className="text-sm text-slate-400">Aucune donnée déclarée pour l&apos;instant — à renseigner à la prochaine relève.</p>
          )}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <DarkCard title={`Maintenance en retard${overdue.length > 0 ? ` (${overdue.length})` : ''}`}>
            {overdue.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {overdue.map((p) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    {p.engine?.label ?? p.equipmentType?.name ?? p.equipmentFreeText ?? '—'}
                  </li>
                ))}
              </ul>
            )}
          </DarkCard>

          <DarkCard title={`Maintenance à venir${upcoming.length > 0 ? ` (${upcoming.length})` : ''}`}>
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {upcoming.map((p) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    {p.engine?.label ?? p.equipmentType?.name ?? p.equipmentFreeText ?? '—'}
                  </li>
                ))}
              </ul>
            )}
            <Link href={`/flotte/${tugId}/maintenance`} className="mt-2 inline-block text-xs font-medium text-amber-300 hover:text-amber-200">
              Voir la maintenance →
            </Link>
          </DarkCard>

          <DarkCard title="Interventions correctives récentes">
            {correctiveInterventions.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {correctiveInterventions.map((i) => (
                  <li key={i.id} className="flex justify-between gap-2">
                    <span>{i.description ?? i.plan?.engine?.label ?? '—'}</span>
                    <span className="shrink-0 text-xs text-slate-400">{fmtDateTime(i.occurredAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </DarkCard>

          <DarkCard title={`Alertes${notifications.length > 0 ? ` (${notifications.length})` : ''}`}>
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-400">Rien à signaler.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {notifications.map((n) => (
                  <li key={n.id} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <Link href="/notifications" className="text-sky-300 hover:text-sky-200">
                      {n.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </DarkCard>

          <DarkCard title="Journal machine — dernières entrées" className="md:col-span-2">
            {machine.logEntries.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune entrée.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {machine.logEntries.slice(0, 5).map((e) => (
                  <li key={e.id} className="flex items-start justify-between gap-2 border-b border-white/10 pb-2 last:border-0 last:pb-0">
                    <span className="flex items-start gap-2">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${STATE_DOT[e.state]}`} />
                      {e.observation}
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">{fmtDateTime(e.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href={`/flotte/${tugId}/machine`} className="mt-2 inline-block text-xs font-medium text-amber-300 hover:text-amber-200">
              Journal machine complet →
            </Link>
          </DarkCard>
        </div>
      </div>
    </div>
  );
}
