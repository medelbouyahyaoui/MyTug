import { listMissions } from '@/lib/missions/actions';

export const dynamic = 'force-dynamic';

const STATUS_STYLE: Record<string, string> = {
  EN_COURS: 'bg-sky-50 text-sky-700',
  TERMINEE: 'bg-emerald-50 text-emerald-700',
  ANNULEE: 'bg-slate-100 text-slate-500',
};

const STATUS_LABEL: Record<string, string> = {
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
};

export default async function MissionsPage() {
  const missions = await listMissions();

  return (
    <div>
      <div className="border-b border-slate-200 px-6 py-4">
        <h1 className="text-lg font-semibold">Missions</h1>
      </div>
      <div className="p-6">
        <table className="w-full border-collapse overflow-hidden rounded-lg border border-slate-200 bg-white text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-2.5">Remorqueur</th>
              <th className="px-4 py-2.5">Pilote</th>
              <th className="px-4 py-2.5">Navire</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Départ</th>
              <th className="px-4 py-2.5">Retour</th>
              <th className="px-4 py-2.5">Statut</th>
            </tr>
          </thead>
          <tbody>
            {missions.map((m) => (
              <tr key={m.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium">
                  {m.tug.name}
                  {m.operationGroupId && (
                    <span className="ml-1.5 text-xs font-normal text-slate-400">· liée</span>
                  )}
                </td>
                <td className="px-4 py-2.5">{m.pilot.name}</td>
                <td className="px-4 py-2.5">{m.vesselName}</td>
                <td className="px-4 py-2.5">{m.movementType.name}</td>
                <td className="px-4 py-2.5 font-mono text-xs">
                  {m.departureFromDockAt.toLocaleString('fr-FR')}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs">
                  {m.returnToDockAt ? m.returnToDockAt.toLocaleString('fr-FR') : '—'}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[m.status]}`}>
                    {STATUS_LABEL[m.status]}
                  </span>
                </td>
              </tr>
            ))}
            {missions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Aucune mission pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
