import Link from 'next/link';
import type { getCaptainDashboard } from '@/lib/dashboard/actions';

type Data = Awaited<ReturnType<typeof getCaptainDashboard>>;

function fmtDateTime(dt: Date | string) {
  return new Date(dt).toLocaleString('fr-FR');
}
function fmtDate(dt: Date | string) {
  return new Date(dt).toLocaleDateString('fr-FR');
}

export function CaptainDashboard({ data }: { data: Data }) {
  const { tug, service, activeMission, recentMissions, myPendingExercises, pendingContestations, notifications, currentFuel, engines } = data;

  const actionsCount = (activeMission ? 1 : 0) + pendingContestations.length + notifications.length + myPendingExercises.length;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Remorqueur & service">
        <p className="font-medium">{tug.name}</p>
        <p className="text-sm text-slate-500">Statut : {tug.status}</p>
        {service ? (
          <>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Équipage en service</p>
            <ul className="mt-1 space-y-0.5 text-sm">
              {service.postAssignments.map((a) => (
                <li key={a.id}>
                  {a.poste.name} : {a.user.firstName} {a.user.lastName}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-400">Aucun service en cours.</p>
        )}
        <Link href={`/flotte/${tug.id}`} className="mt-2 inline-block text-xs font-medium text-sky-600 hover:text-sky-700">
          Voir la fiche remorqueur →
        </Link>
      </Card>

      <Card title="Mission active">
        {activeMission ? (
          <>
            <p className="font-medium">{activeMission.vesselName}</p>
            <p className="text-sm text-slate-500">
              {activeMission.movementType.name} — Pilote {activeMission.pilot.name}
            </p>
            <p className="text-xs text-slate-400">Départ : {fmtDateTime(activeMission.departureFromDockAt)}</p>
          </>
        ) : (
          <p className="text-sm text-slate-400">Aucune mission active.</p>
        )}
        <Link href={`/flotte/${tug.id}/mission`} className="mt-2 inline-block text-xs font-medium text-sky-600 hover:text-sky-700">
          Aller aux missions →
        </Link>
      </Card>

      <Card title="Carburant & heures moteur">
        <p className="text-sm">Carburant déclaré : {currentFuel ? `${currentFuel.quantity} t` : '—'}</p>
        <ul className="mt-1 space-y-0.5 text-sm">
          {engines.map((e) => (
            <li key={e.id}>
              {e.label} : {e.currentHours.toLocaleString('fr-FR')} h
            </li>
          ))}
        </ul>
        <Link href={`/flotte/${tug.id}/machine`} className="mt-2 inline-block text-xs font-medium text-sky-600 hover:text-sky-700">
          Journal machine →
        </Link>
      </Card>

      <Card title={`Actions à effectuer${actionsCount > 0 ? ` (${actionsCount})` : ''}`}>
        <ul className="space-y-1.5 text-sm">
          {activeMission && !activeMission.returnToDockAt && (
            <li>
              <Link href={`/flotte/${tug.id}/mission`} className="text-sky-600 hover:text-sky-700">
                Mission en cours sans retour au quai enregistré →
              </Link>
            </li>
          )}
          {pendingContestations.map((c) => (
            <li key={c.id}>
              Contestation de {c.author.firstName} {c.author.lastName} sur votre déclaration : {c.contestedItem}
            </li>
          ))}
          {myPendingExercises.map((e) => (
            <li key={e.id}>
              <Link href={`/flotte/${tug.id}/certificats-exercices`} className="text-sky-600 hover:text-sky-700">
                Exercice {e.type.name} — {e.status === 'EN_RETARD' ? 'en retard' : 'à réaliser'} →
              </Link>
            </li>
          ))}
          {notifications.map((n) => (
            <li key={n.id}>
              <Link href="/notifications" className="text-sky-600 hover:text-sky-700">
                {n.title}
              </Link>
            </li>
          ))}
          {actionsCount === 0 && <li className="text-slate-400">Rien à signaler.</li>}
        </ul>
      </Card>

      <Card title="Missions récentes" className="md:col-span-2">
        {recentMissions.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune mission.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {recentMissions.map((m) => (
              <li key={m.id} className="flex justify-between border-b border-slate-100 py-1 last:border-0">
                <span>
                  {m.vesselName} — {m.movementType.name} — {m.pilot.name}
                </span>
                <span className="text-xs text-slate-400">
                  {fmtDate(m.departureFromDockAt)} · {m.status}
                </span>
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
