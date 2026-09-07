'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createMission, markMissionStep, cancelMission } from '@/lib/missions/actions';
import type { Mission, MovementType, Pilot, Tug, TugType } from '@prisma/client';

type ActiveMission = Mission & { pilot: Pilot; movementType: MovementType };
type OpenOperation = Mission & { tug: Tug; pilot: Pilot; movementType: MovementType };

function toLocalInput(date: Date | null) {
  const d = date ? new Date(date) : new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function MissionFlow({
  tugId,
  activeMission,
  pilots,
  movementTypes,
  tugTypes,
  openOperations,
}: {
  tugId: string;
  activeMission: ActiveMission | null;
  pilots: Pilot[];
  movementTypes: MovementType[];
  tugTypes: TugType[];
  openOperations: OpenOperation[];
}) {
  if (activeMission) {
    return <MissionChronology mission={activeMission} />;
  }
  return (
    <NewMissionForm
      tugId={tugId}
      pilots={pilots}
      movementTypes={movementTypes}
      tugTypes={tugTypes}
      openOperations={openOperations}
    />
  );
}

function NewMissionForm({
  tugId,
  pilots,
  movementTypes,
  tugTypes,
  openOperations,
}: {
  tugId: string;
  pilots: Pilot[];
  movementTypes: MovementType[];
  tugTypes: TugType[];
  openOperations: OpenOperation[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<'new' | 'join'>('new');
  const [joinId, setJoinId] = useState(openOperations[0]?.id ?? '');
  const [pilotId, setPilotId] = useState(pilots[0]?.id ?? '');
  const [vesselName, setVesselName] = useState('');
  const [movementTypeId, setMovementTypeId] = useState(movementTypes[0]?.id ?? '');
  const [movementTypeOtherDetail, setMovementTypeOtherDetail] = useState('');
  const [position, setPosition] = useState('');
  const [requestedTugTypeId, setRequestedTugTypeId] = useState('');
  const [externalAssistance, setExternalAssistance] = useState(false);
  const [externalCompany, setExternalCompany] = useState('');
  const [externalReason, setExternalReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const movementTypeName = movementTypes.find((m) => m.id === movementTypeId)?.name;
  const isOther = movementTypeName === 'Autre';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createMission({
        tugId,
        pilotId,
        vesselName,
        movementTypeId,
        movementTypeOtherDetail: isOther ? movementTypeOtherDetail : undefined,
        position,
        requestedTugTypeId: requestedTugTypeId || undefined,
        externalAssistanceRequested: externalAssistance,
        externalAssistanceCompany: externalAssistance ? externalCompany : undefined,
        externalAssistanceReason: externalAssistance ? externalReason : undefined,
        joinOperationMissionId: mode === 'join' ? joinId : undefined,
      });
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold">Cette mission implique-t-elle plusieurs remorqueurs ?</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              mode === 'new' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'
            }`}
          >
            Nouvelle opération
          </button>
          <button
            type="button"
            disabled={openOperations.length === 0}
            onClick={() => setMode('join')}
            className={`rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-40 ${
              mode === 'join' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'
            }`}
          >
            Rejoindre une opération en cours
          </button>
        </div>

        {mode === 'join' && (
          <div className="mt-3">
            <label className="mb-1 block text-xs text-slate-500">Opération à rejoindre</label>
            <select
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {openOperations.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.tug.name} — {op.movementType.name}, {op.vesselName} — en cours depuis{' '}
                  {op.departureFromDockAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-400">
              Pilote, navire et type de mouvement seront repris de l&apos;opération ; ce remorqueur saisira
              ensuite ses propres horaires, indépendamment des autres.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {mode === 'new' && (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold">Informations générales</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Pilote</label>
                <select
                  value={pilotId}
                  onChange={(e) => setPilotId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {pilots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Navire</label>
                <input
                  required
                  value={vesselName}
                  onChange={(e) => setVesselName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Type de mouvement</label>
                <select
                  value={movementTypeId}
                  onChange={(e) => setMovementTypeId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {movementTypes.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              {isOther && (
                <input
                  value={movementTypeOtherDetail}
                  onChange={(e) => setMovementTypeOtherDetail(e.target.value)}
                  placeholder="Précisez le type de mouvement"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              )}
              <div>
                <label className="mb-1 block text-xs text-slate-500">Position</label>
                <input
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {mode === 'new' && (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold">Informations complémentaires (facultatif)</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-500">
                  Type de remorqueur demandé par le pilote
                </label>
                <select
                  value={requestedTugTypeId}
                  onChange={(e) => setRequestedTugTypeId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">— Identique au type réel —</option>
                  {tugTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={externalAssistance}
                  onChange={(e) => setExternalAssistance(e.target.checked)}
                />
                Assistance d&apos;un remorqueur externe sollicitée
              </label>
              {externalAssistance && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={externalCompany}
                    onChange={(e) => setExternalCompany(e.target.value)}
                    placeholder="Compagnie / remorqueur externe"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    value={externalReason}
                    onChange={(e) => setExternalReason(e.target.value)}
                    placeholder="Motif"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isPending || (mode === 'join' && !joinId)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {isPending ? 'Départ en cours…' : 'Départ du quai — démarrer la mission'}
        </button>
      </form>
    </div>
  );
}

const STEPS: { key: 'movementStartAt' | 'movementEndAt' | 'returnToDockAt'; label: string }[] = [
  { key: 'movementStartAt', label: 'Début du mouvement' },
  { key: 'movementEndAt', label: 'Fin du mouvement' },
  { key: 'returnToDockAt', label: 'Retour au quai — clôture la mission' },
];

function MissionChronology({ mission }: { mission: ActiveMission }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({
    movementStartAt: toLocalInput(mission.movementStartAt),
    movementEndAt: toLocalInput(mission.movementEndAt),
    returnToDockAt: toLocalInput(mission.returnToDockAt),
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirm(step: 'movementStartAt' | 'movementEndAt' | 'returnToDockAt') {
    setError(null);
    startTransition(async () => {
      const result = await markMissionStep(mission.id, step, values[step]);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  function handleCancel() {
    startTransition(async () => {
      await cancelMission(mission.id);
      router.refresh();
    });
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold">Informations générales</h2>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-slate-500">Pilote</span>
          <span>{mission.pilot.name}</span>
          <span className="text-slate-500">Navire</span>
          <span>{mission.vesselName}</span>
          <span className="text-slate-500">Type</span>
          <span>{mission.movementType.name}</span>
          {mission.position && (
            <>
              <span className="text-slate-500">Position</span>
              <span>{mission.position}</span>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold">Chronologie de la mission</h2>

        <div className="mb-4 flex gap-3 border-b border-slate-100 pb-4">
          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
          <div>
            <div className="text-sm font-medium">Départ du quai</div>
            <div className="text-xs text-slate-400">
              {mission.departureFromDockAt.toLocaleString('fr-FR')}
            </div>
          </div>
        </div>

        {STEPS.map((step, i) => {
          const done = !!mission[step.key];
          const prevDone = i === 0 || !!mission[STEPS[i - 1].key];
          return (
            <div
              key={step.key}
              className={`mb-4 flex gap-3 border-b border-slate-100 pb-4 last:mb-0 last:border-0 last:pb-0 ${
                !prevDone && !done ? 'opacity-40' : ''
              }`}
            >
              <span
                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                  done ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{step.label}</div>
                {done ? (
                  <div className="text-xs text-slate-400">{mission[step.key]!.toLocaleString('fr-FR')}</div>
                ) : (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      type="datetime-local"
                      value={values[step.key]}
                      onChange={(e) => setValues((v) => ({ ...v, [step.key]: e.target.value }))}
                      disabled={!prevDone}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-50"
                    />
                    <button
                      type="button"
                      disabled={!prevDone || isPending}
                      onClick={() => confirm(step.key)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${
                        step.key === 'returnToDockAt'
                          ? 'bg-slate-900 text-white hover:bg-slate-700'
                          : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Marquer maintenant
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <p className="mt-4 text-xs text-slate-400">
          Le remorqueur redevient &quot;Disponible&quot; uniquement une fois le retour au quai enregistré.
        </p>
      </div>

      {!mission.movementStartAt && (
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="text-xs text-red-600 hover:underline"
        >
          Annuler cette mission
        </button>
      )}
    </div>
  );
}
