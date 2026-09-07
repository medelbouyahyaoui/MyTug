'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createMachineLogEntry, createFluidRefill, createEngine, type ActionResult } from '@/lib/machine/actions';
import type { getMachineOverview } from '@/lib/machine/actions';

type Data = Awaited<ReturnType<typeof getMachineOverview>>;

const STATE_LABEL: Record<string, string> = {
  NORMAL: 'Normal',
  A_SURVEILLER: 'À surveiller',
  PANNE: 'Panne',
};
const STATE_CLASS: Record<string, string> = {
  NORMAL: 'bg-emerald-100 text-emerald-700',
  A_SURVEILLER: 'bg-amber-100 text-amber-700',
  PANNE: 'bg-red-100 text-red-700',
};
const ENGINE_KIND_LABEL: Record<string, string> = { PRINCIPAL: 'Principal', AUXILIAIRE: 'Auxiliaire' };

function fmt(dt: Date | string) {
  return new Date(dt).toLocaleString('fr-FR');
}

export function MachineView({ tugId, data }: { tugId: string; data: Data }) {
  const { tug, engines, fuelEvents, oilEvents, logEntries, currentFuelLevel, currentOilLevel, fuelPct, fuelAlert, fuelAlertThresholdPct, canWrite, canManageEngines } = data;

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-2">
      <FluidCard
        title="Carburant"
        unit="t"
        capacity={tug.fuelCapacityT}
        currentLevel={currentFuelLevel}
        pct={fuelPct}
        alert={fuelAlert}
        alertThresholdPct={fuelAlertThresholdPct}
        events={fuelEvents}
        fluidType="CARBURANT"
        tugId={tugId}
        canWrite={canWrite}
      />
      <FluidCard
        title="Huile"
        unit="L"
        capacity={tug.oilCapacityL}
        currentLevel={currentOilLevel}
        pct={null}
        alert={false}
        alertThresholdPct={null}
        events={oilEvents}
        fluidType="HUILE"
        tugId={tugId}
        canWrite={canWrite}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
        <h2 className="mb-3 text-sm font-semibold">Heures moteur</h2>
        {engines.length === 0 && <p className="text-sm text-slate-400">Aucun moteur configuré sur la fiche remorqueur.</p>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {engines.map((engine) => (
            <div key={engine.id} className="rounded-lg border border-slate-100 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{ENGINE_KIND_LABEL[engine.kind]}</p>
              <p className="font-medium">{engine.label}</p>
              <p className="mt-1 text-2xl font-bold">
                {engine.currentHours.toLocaleString('fr-FR')} <span className="text-sm font-normal text-slate-400">h</span>
              </p>
              {engine.hourReadings.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-slate-400">
                  {engine.hourReadings.map((r) => (
                    <li key={r.id}>
                      {r.hours.toLocaleString('fr-FR')} h — {fmt(r.recordedAt)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Source unique des relevés : la déclaration de relève du chef mécanicien, à chaque fin de service.
        </p>

        {canManageEngines && <AddEngineForm tugId={tugId} />}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
        <JournalMachine tugId={tugId} entries={logEntries} canWrite={canWrite} />
      </div>
    </div>
  );
}

function FluidCard({
  title,
  unit,
  capacity,
  currentLevel,
  pct,
  alert,
  alertThresholdPct,
  events,
  fluidType,
  tugId,
  canWrite,
}: {
  title: string;
  unit: string;
  capacity: number | null;
  currentLevel: number | null;
  pct: number | null;
  alert: boolean;
  alertThresholdPct: number | null;
  events: Data['fuelEvents'];
  fluidType: 'CARBURANT' | 'HUILE';
  tugId: string;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  function submit() {
    setError(null);
    const parsed = Number(quantity);
    if (!quantity || Number.isNaN(parsed) || parsed <= 0) {
      setError('Quantité invalide.');
      return;
    }
    startTransition(async () => {
      const result: ActionResult = await createFluidRefill({ tugId, fluidType, quantity: parsed });
      if (result.ok) {
        setQuantity('');
        setShowForm(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        {alert && (
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
            Seuil d&apos;alerte franchi ({alertThresholdPct}%)
          </span>
        )}
      </div>

      <p className="mt-2 text-2xl font-bold">
        {currentLevel != null ? currentLevel.toLocaleString('fr-FR') : '—'}{' '}
        <span className="text-sm font-normal text-slate-400">
          {unit} {capacity ? `/ ${capacity.toLocaleString('fr-FR')} ${unit}` : ''}
        </span>
      </p>
      {pct != null && (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full ${alert ? 'bg-red-500' : 'bg-sky-500'}`}
            style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
          />
        </div>
      )}
      <p className="mt-1 text-xs text-slate-400">Niveau déclaré à la dernière relève du chef mécanicien.</p>

      {canWrite && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          {!showForm ? (
            <button onClick={() => setShowForm(true)} className="text-xs font-medium text-sky-600 hover:text-sky-700">
              + Avitaillement
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={`Quantité ajoutée (${unit})`}
                className="w-40 rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
              <button
                onClick={submit}
                disabled={isPending}
                className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Enregistrer
              </button>
              <button onClick={() => setShowForm(false)} className="text-xs text-slate-400 hover:text-slate-600">
                Annuler
              </button>
            </div>
          )}
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      )}

      {events.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
          {events.map((e) => (
            <li key={e.id} className="flex justify-between">
              <span>{e.eventType === 'AVITAILLEMENT' ? `+ ${e.quantity.toLocaleString('fr-FR')} ${unit}` : `Niveau : ${e.quantity.toLocaleString('fr-FR')} ${unit}`}</span>
              <span className="text-slate-400">{fmt(e.recordedAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function JournalMachine({ tugId, entries, canWrite }: { tugId: string; entries: Data['logEntries']; canWrite: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [state, setState] = useState('NORMAL');
  const [observation, setObservation] = useState('');
  const [isIncident, setIsIncident] = useState(false);
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (!observation.trim()) {
      setError('Observation requise.');
      return;
    }
    startTransition(async () => {
      const result: ActionResult = await createMachineLogEntry({
        tugId,
        state: state as 'NORMAL' | 'A_SURVEILLER' | 'PANNE',
        observation,
        isIncident,
        correctiveAction: correctiveAction || undefined,
        remarks: remarks || undefined,
      });
      if (result.ok) {
        setObservation('');
        setCorrectiveAction('');
        setRemarks('');
        setIsIncident(false);
        setState('NORMAL');
        setShowForm(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Journal machine</h2>
        {canWrite && !showForm && (
          <button onClick={() => setShowForm(true)} className="text-xs font-medium text-sky-600 hover:text-sky-700">
            + Nouvelle entrée
          </button>
        )}
      </div>

      {showForm && (
        <div className="mt-3 space-y-3 rounded-lg border border-slate-200 p-4">
          <div>
            <label className="block text-xs font-medium text-slate-500">État machine</label>
            <select value={state} onChange={(e) => setState(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
              <option value="NORMAL">Normal</option>
              <option value="A_SURVEILLER">À surveiller</option>
              <option value="PANNE">Panne</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Observation</label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isIncident} onChange={(e) => setIsIncident(e.target.checked)} />
            Il s&apos;agit d&apos;un incident
          </label>
          {isIncident && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Un incident pourra donner lieu à une intervention de maintenance corrective une fois le module Maintenance disponible.
            </p>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-500">Action corrective (facultatif)</label>
            <input
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Remarques (facultatif)</label>
            <input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={isPending}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Enregistrer
            </button>
            <button onClick={() => setShowForm(false)} className="text-xs text-slate-400 hover:text-slate-600">
              Annuler
            </button>
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm && <p className="mt-3 text-sm text-slate-400">Aucune entrée enregistrée.</p>}

      <ul className="mt-3 space-y-3">
        {entries.map((entry) => (
          <li key={entry.id} className="border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATE_CLASS[entry.state]}`}>{STATE_LABEL[entry.state]}</span>
              {entry.isIncident && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Incident</span>}
              <span className="ml-auto font-mono text-xs text-slate-400">{fmt(entry.createdAt)}</span>
            </div>
            <p className="mt-1">{entry.observation}</p>
            {entry.correctiveAction && <p className="mt-0.5 text-xs text-slate-500">Action corrective : {entry.correctiveAction}</p>}
            {entry.remarks && <p className="mt-0.5 text-xs text-slate-500">Remarques : {entry.remarks}</p>}
            <p className="mt-0.5 text-xs text-slate-400">
              Par {entry.user.firstName} {entry.user.lastName}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddEngineForm({ tugId }: { tugId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [kind, setKind] = useState('PRINCIPAL');
  const [label, setLabel] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [powerKw, setPowerKw] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (!label.trim()) {
      setError('Libellé requis.');
      return;
    }
    startTransition(async () => {
      const result: ActionResult = await createEngine({
        tugId,
        kind: kind as 'PRINCIPAL' | 'AUXILIAIRE',
        label,
        manufacturer: manufacturer || undefined,
        model: model || undefined,
        powerKw: powerKw ? Number(powerKw) : undefined,
      });
      if (result.ok) {
        setLabel('');
        setManufacturer('');
        setModel('');
        setPowerKw('');
        setShowForm(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!showForm) {
    return (
      <button onClick={() => setShowForm(true)} className="mt-3 text-xs font-medium text-sky-600 hover:text-sky-700">
        + Ajouter un moteur
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-slate-200 p-4">
      <div className="grid grid-cols-2 gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          <option value="PRINCIPAL">Principal</option>
          <option value="AUXILIAIRE">Auxiliaire</option>
        </select>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Libellé (ex: Moteur principal 1)"
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        <input
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
          placeholder="Constructeur (facultatif)"
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Modèle (facultatif)"
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        <input
          type="number"
          value={powerKw}
          onChange={(e) => setPowerKw(e.target.value)}
          placeholder="Puissance kW (facultatif)"
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={isPending}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Ajouter
        </button>
        <button onClick={() => setShowForm(false)} className="text-xs text-slate-400 hover:text-slate-600">
          Annuler
        </button>
      </div>
    </div>
  );
}
