import Link from 'next/link';
import type { getCaptainDashboard } from '@/lib/dashboard/actions';
import { RadialGauge } from '@/components/radial-gauge';
import { ZelligePattern } from '@/components/zellige-pattern';
import { DarkCard } from '@/components/dark-card';

type Data = Awaited<ReturnType<typeof getCaptainDashboard>>;

function fmtDateTime(dt: Date | string) {
  return new Date(dt).toLocaleString('fr-FR');
}
function fmtDate(dt: Date | string) {
  return new Date(dt).toLocaleDateString('fr-FR');
}

const STATUS_LABEL: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  OCCUPE: 'En mission',
  MAINTENANCE: 'En maintenance',
  DESARME: 'Désarmé',
  ACTIVE_TEMPORAIREMENT: 'Activé temporairement',
  INDISPONIBLE: 'Indisponible',
};
const STATUS_BADGE: Record<string, string> = {
  DISPONIBLE: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  OCCUPE: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
  MAINTENANCE: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  DESARME: 'bg-slate-400/15 text-slate-300 border-slate-400/30',
  ACTIVE_TEMPORAIREMENT: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  INDISPONIBLE: 'bg-red-400/15 text-red-300 border-red-400/30',
};

export function CaptainDashboard({ data }: { data: Data }) {
  const { tug, service, activeMission, recentMissions, myPendingExercises, pendingContestations, notifications, currentFuel, engines } = data;

  const actionsCount = (activeMission ? 1 : 0) + pendingContestations.length + notifications.length + myPendingExercises.length;

  const fuelPct = currentFuel && tug.fuelCapacityT ? (currentFuel.quantity / tug.fuelCapacityT) * 100 : null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 text-slate-100">
      <ZelligePattern className="pointer-events-none absolute inset-0 h-full w-full text-amber-300" />

      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">Passerelle</p>
            <h2 className="font-serif text-2xl text-white">{tug.name}</h2>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_BADGE[tug.status]}`}>
            {STATUS_LABEL[tug.status]}
          </span>
        </div>

        {/* Jauges — données réelles uniquement */}
        <div className="mt-6 flex flex-wrap items-end gap-8 rounded-xl bg-white/5 p-5">
          {fuelPct != null && <RadialGauge value={fuelPct} label="Carburant" colorClass="text-amber-400" />}
          {engines.length > 0 && (
            <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-300">
              {engines.map((e) => (
                <li key={e.id}>
                  <span className="text-slate-400">{e.label} : </span>
                  {e.currentHours.toLocaleString('fr-FR')} h
                </li>
              ))}
            </ul>
          )}
          {fuelPct == null && engines.length === 0 && (
            <p className="text-sm text-slate-400">Aucune donnée déclarée pour l&apos;instant.</p>
          )}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <DarkCard title="Équipage en service">
            {service ? (
              <ul className="space-y-1 text-sm">
                {service.postAssignments.map((a) => (
                  <li key={a.id}>
                    <span className="text-slate-400">{a.poste.name} : </span>
                    {a.user.firstName} {a.user.lastName}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">Aucun service en cours.</p>
            )}
            <Link href={`/flotte/${tug.id}`} className="mt-2 inline-block text-xs font-medium text-amber-300 hover:text-amber-200">
              Voir la fiche remorqueur →
            </Link>
          </DarkCard>

          <DarkCard title="Mission active">
            {activeMission ? (
              <>
                <p className="text-sm font-medium text-white">{activeMission.vesselName}</p>
                <p className="text-sm text-slate-300">
                  {activeMission.movementType.name} — Pilote {activeMission.pilot.name}
                </p>
                <p className="text-xs text-slate-400">Départ : {fmtDateTime(activeMission.departureFromDockAt)}</p>
              </>
            ) : (
              <p className="text-sm text-slate-400">Aucune mission active.</p>
            )}
            <Link href={`/flotte/${tug.id}/mission`} className="mt-2 inline-block text-xs font-medium text-amber-300 hover:text-amber-200">
              Aller aux missions →
            </Link>
          </DarkCard>

          <DarkCard title={`Actions à effectuer${actionsCount > 0 ? ` (${actionsCount})` : ''}`} className="md:col-span-2">
            <ul className="space-y-1.5 text-sm">
              {activeMission && !activeMission.returnToDockAt && (
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <Link href={`/flotte/${tug.id}/mission`} className="text-sky-300 hover:text-sky-200">
                    Mission en cours sans retour au quai enregistré →
                  </Link>
                </li>
              )}
              {pendingContestations.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  Contestation de {c.author.firstName} {c.author.lastName} sur votre déclaration : {c.contestedItem}
                </li>
              ))}
              {myPendingExercises.map((e) => (
                <li key={e.id} className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${e.status === 'EN_RETARD' ? 'bg-red-400' : 'bg-amber-400'}`} />
                  <Link href={`/flotte/${tug.id}/certificats-exercices`} className="text-sky-300 hover:text-sky-200">
                    Exercice {e.type.name} — {e.status === 'EN_RETARD' ? 'en retard' : 'à réaliser'} →
                  </Link>
                </li>
              ))}
              {notifications.map((n) => (
                <li key={n.id} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <Link href="/notifications" className="text-sky-300 hover:text-sky-200">
                    {n.title}
                  </Link>
                </li>
              ))}
              {actionsCount === 0 && <li className="text-slate-400">Rien à signaler.</li>}
            </ul>
          </DarkCard>

          <DarkCard title="Missions récentes" className="md:col-span-2">
            {recentMissions.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune mission.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {recentMissions.map((m) => (
                  <li key={m.id} className="flex justify-between gap-2 border-b border-white/10 py-1 last:border-0">
                    <span>
                      {m.vesselName} — {m.movementType.name} — {m.pilot.name}
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">
                      {fmtDate(m.departureFromDockAt)} · {m.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DarkCard>
        </div>
      </div>
    </div>
  );
}
