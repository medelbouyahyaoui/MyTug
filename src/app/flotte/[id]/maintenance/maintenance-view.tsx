'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createMaintenancePlan,
  createMaintenanceIntervention,
  toggleMaintenanceTask,
  createEquipmentType,
  type ActionResult,
  type CreateTypeResult,
  type getMaintenanceOverview,
} from '@/lib/maintenance/actions';
import type { MachineLogEntry } from '@prisma/client';

type Data = Awaited<ReturnType<typeof getMaintenanceOverview>>;

const URGENCY_LABEL: Record<string, string> = { OK: 'OK', BIENTOT: 'Bientôt', ECHU: 'Échu' };
const URGENCY_CLASS: Record<string, string> = {
  OK: 'bg-emerald-100 text-emerald-700',
  BIENTOT: 'bg-amber-100 text-amber-700',
  ECHU: 'bg-red-100 text-red-700',
};
const CALENDAR_UNIT_LABEL: Record<string, string> = { JOURS: 'jour(s)', MOIS: 'mois', ANNEES: 'année(s)' };
const INTERVAL_TYPE_LABEL: Record<string, string> = { HEURES: 'Heures moteur', CALENDAIRE: 'Calendaire', LES_DEUX: 'Heures + calendaire' };
const MAINTENANCE_TYPE_LABEL: Record<string, string> = { PREVENTIVE: 'Préventive', CORRECTIVE: 'Corrective' };

function fmtDate(dt: Date | string | null) {
  return dt ? new Date(dt).toLocaleDateString('fr-FR') : '—';
}
function fmtDateTime(dt: Date | string) {
  return new Date(dt).toLocaleString('fr-FR');
}
function equipmentLabel(item: { engine: { label: string } | null; equipmentType: { name: string } | null; equipmentFreeText: string | null }) {
  return item.engine?.label ?? item.equipmentType?.name ?? item.equipmentFreeText ?? '—';
}
function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MaintenanceView({ tugId, data, fromLogEntry }: { tugId: string; data: Data; fromLogEntry: MachineLogEntry | null }) {
  const { engines, equipmentTypes, plans, interventions, canWrite, canManageEquipmentTypes } = data;

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <PlansSection tugId={tugId} plans={plans} engines={engines} equipmentTypes={equipmentTypes} canWrite={canWrite} canManageEquipmentTypes={canManageEquipmentTypes} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <InterventionsSection tugId={tugId} interventions={interventions} plans={plans} canWrite={canWrite} fromLogEntry={fromLogEntry} />
      </div>
    </div>
  );
}

function PlansSection({
  tugId,
  plans,
  engines,
  equipmentTypes,
  canWrite,
  canManageEquipmentTypes,
}: {
  tugId: string;
  plans: Data['plans'];
  engines: Data['engines'];
  equipmentTypes: Data['equipmentTypes'];
  canWrite: boolean;
  canManageEquipmentTypes: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [source, setSource] = useState<'ENGINE' | 'TYPE' | 'FREE'>('ENGINE');
  const [engineId, setEngineId] = useState(engines[0]?.id ?? '');
  const [equipmentTypeId, setEquipmentTypeId] = useState(equipmentTypes[0]?.id ?? '');
  const [equipmentFreeText, setEquipmentFreeText] = useState('');
  const [intervalType, setIntervalType] = useState<'HEURES' | 'CALENDAIRE' | 'LES_DEUX'>('HEURES');
  const [intervalHours, setIntervalHours] = useState('');
  const [intervalCalendarValue, setIntervalCalendarValue] = useState('');
  const [intervalCalendarUnit, setIntervalCalendarUnit] = useState<'JOURS' | 'MOIS' | 'ANNEES'>('MOIS');
  const [lastDoneAt, setLastDoneAt] = useState('');
  const [lastDoneHours, setLastDoneHours] = useState('');
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [newEquipmentTypeName, setNewEquipmentTypeName] = useState('');

  function addEquipmentType() {
    if (!newEquipmentTypeName.trim()) return;
    startTransition(async () => {
      const result: CreateTypeResult = await createEquipmentType(newEquipmentTypeName);
      if (result.ok) {
        setNewEquipmentTypeName('');
        setEquipmentTypeId(result.id);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result: ActionResult = await createMaintenancePlan({
        tugId,
        engineId: source === 'ENGINE' ? engineId : undefined,
        equipmentTypeId: source === 'TYPE' ? equipmentTypeId : undefined,
        equipmentFreeText: source === 'FREE' ? equipmentFreeText : undefined,
        intervalType,
        intervalHours: intervalType !== 'CALENDAIRE' && intervalHours ? Number(intervalHours) : undefined,
        intervalCalendarValue: intervalType !== 'HEURES' && intervalCalendarValue ? Number(intervalCalendarValue) : undefined,
        intervalCalendarUnit: intervalType !== 'HEURES' ? intervalCalendarUnit : undefined,
        lastDoneAt: lastDoneAt || undefined,
        lastDoneHours: lastDoneHours ? Number(lastDoneHours) : undefined,
        instructions: instructions || undefined,
      });
      if (result.ok) {
        setShowForm(false);
        setEquipmentFreeText('');
        setIntervalHours('');
        setIntervalCalendarValue('');
        setLastDoneAt('');
        setLastDoneHours('');
        setInstructions('');
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Plans de maintenance préventive</h2>
        {canWrite && !showForm && (
          <button onClick={() => setShowForm(true)} className="text-xs font-medium text-sky-600 hover:text-sky-700">
            + Nouveau plan
          </button>
        )}
      </div>

      {showForm && (
        <div className="mt-3 space-y-3 rounded-lg border border-slate-200 p-4">
          <div>
            <label className="block text-xs font-medium text-slate-500">Équipement</label>
            <div className="mt-1 flex gap-2">
              <select value={source} onChange={(e) => setSource(e.target.value as typeof source)} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                <option value="ENGINE">Moteur</option>
                <option value="TYPE">Type référencé</option>
                <option value="FREE">Libre</option>
              </select>
              {source === 'ENGINE' && (
                <select value={engineId} onChange={(e) => setEngineId(e.target.value)} className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                  {engines.length === 0 && <option value="">Aucun moteur configuré</option>}
                  {engines.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.label}
                    </option>
                  ))}
                </select>
              )}
              {source === 'TYPE' && (
                <select value={equipmentTypeId} onChange={(e) => setEquipmentTypeId(e.target.value)} className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                  {equipmentTypes.length === 0 && <option value="">Aucun type configuré</option>}
                  {equipmentTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
              {source === 'FREE' && (
                <input
                  value={equipmentFreeText}
                  onChange={(e) => setEquipmentFreeText(e.target.value)}
                  placeholder="ex: Treuil, pompe incendie..."
                  className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                />
              )}
            </div>
            {canManageEquipmentTypes && source === 'TYPE' && (
              <div className="mt-1.5 flex gap-2">
                <input
                  value={newEquipmentTypeName}
                  onChange={(e) => setNewEquipmentTypeName(e.target.value)}
                  placeholder="+ Ajouter un type au référentiel"
                  className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs"
                />
                <button onClick={addEquipmentType} className="text-xs font-medium text-sky-600 hover:text-sky-700">
                  Ajouter
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500">Type d&apos;intervalle</label>
            <select value={intervalType} onChange={(e) => setIntervalType(e.target.value as typeof intervalType)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
              <option value="HEURES">Toutes les X heures moteur</option>
              <option value="CALENDAIRE">Calendaire</option>
              <option value="LES_DEUX">Les deux</option>
            </select>
          </div>

          {intervalType !== 'CALENDAIRE' && (
            <div>
              <label className="block text-xs font-medium text-slate-500">Intervalle (heures)</label>
              <input type="number" value={intervalHours} onChange={(e) => setIntervalHours(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
            </div>
          )}
          {intervalType !== 'HEURES' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-500">Intervalle (valeur)</label>
                <input type="number" value={intervalCalendarValue} onChange={(e) => setIntervalCalendarValue(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">Unité</label>
                <select value={intervalCalendarUnit} onChange={(e) => setIntervalCalendarUnit(e.target.value as typeof intervalCalendarUnit)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                  <option value="JOURS">Jours</option>
                  <option value="MOIS">Mois</option>
                  <option value="ANNEES">Années</option>
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-500">Dernière réalisation (date, facultatif)</label>
              <input type="date" value={lastDoneAt} onChange={(e) => setLastDoneAt(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Dernières heures moteur (facultatif)</label>
              <input type="number" value={lastDoneHours} onChange={(e) => setLastDoneHours(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500">Instructions (facultatif)</label>
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={submit} disabled={isPending} className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50">
              Créer le plan
            </button>
            <button onClick={() => setShowForm(false)} className="text-xs text-slate-400 hover:text-slate-600">
              Annuler
            </button>
          </div>
        </div>
      )}

      {plans.length === 0 && !showForm && <p className="mt-3 text-sm text-slate-400">Aucun plan de maintenance.</p>}

      <ul className="mt-3 space-y-3">
        {plans.map((plan) => (
          <li key={plan.id} className="border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{equipmentLabel(plan)}</span>
              {plan.urgency && <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_CLASS[plan.urgency]}`}>{URGENCY_LABEL[plan.urgency]}</span>}
              <span className="ml-auto text-xs text-slate-400">{INTERVAL_TYPE_LABEL[plan.intervalType]}</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {plan.intervalHours != null && `Toutes les ${plan.intervalHours} h`}
              {plan.intervalHours != null && plan.intervalCalendarValue != null && ' · '}
              {plan.intervalCalendarValue != null && `Tous les ${plan.intervalCalendarValue} ${CALENDAR_UNIT_LABEL[plan.intervalCalendarUnit ?? 'MOIS']}`}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Dernière réalisation : {fmtDate(plan.lastDoneAt)}
              {plan.lastDoneHours != null && ` (${plan.lastDoneHours} h)`} — Prochaine échéance :{' '}
              {plan.nextDueAt ? fmtDate(plan.nextDueAt) : plan.nextDueHours != null ? `${plan.nextDueHours} h` : '—'}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Responsable : {plan.responsible.firstName} {plan.responsible.lastName}
            </p>
            {plan.instructions && <p className="mt-0.5 text-xs text-slate-500">{plan.instructions}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function InterventionsSection({
  tugId,
  interventions,
  plans,
  canWrite,
  fromLogEntry,
}: {
  tugId: string;
  interventions: Data['interventions'];
  plans: Data['plans'];
  canWrite: boolean;
  fromLogEntry: MachineLogEntry | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(!!fromLogEntry);
  const [type, setType] = useState<'PREVENTIVE' | 'CORRECTIVE'>(fromLogEntry ? 'CORRECTIVE' : 'PREVENTIVE');
  const [planId, setPlanId] = useState('');
  const [occurredAt, setOccurredAt] = useState(toLocalInput(new Date()));
  const [engineHours, setEngineHours] = useState('');
  const [description, setDescription] = useState(fromLogEntry ? fromLogEntry.observation : '');
  const [performedBy, setPerformedBy] = useState('');
  const [status, setStatus] = useState('terminée');
  const [partsUsed, setPartsUsed] = useState('');
  const [remarks, setRemarks] = useState('');
  const [tasks, setTasks] = useState<{ description: string; isRequired: boolean }[]>([]);
  const [error, setError] = useState<string | null>(null);

  function addTaskRow() {
    setTasks((t) => [...t, { description: '', isRequired: false }]);
  }
  function updateTask(i: number, patch: Partial<{ description: string; isRequired: boolean }>) {
    setTasks((t) => t.map((task, idx) => (idx === i ? { ...task, ...patch } : task)));
  }
  function removeTask(i: number) {
    setTasks((t) => t.filter((_, idx) => idx !== i));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result: ActionResult = await createMaintenanceIntervention({
        tugId,
        planId: planId || undefined,
        type,
        occurredAt,
        engineHoursAtIntervention: engineHours ? Number(engineHours) : undefined,
        description: description || undefined,
        performedBy: performedBy || undefined,
        status,
        partsUsed: partsUsed || undefined,
        remarks: remarks || undefined,
        tasks: tasks.filter((t) => t.description.trim()),
        fromMachineLogEntryId: fromLogEntry?.id,
      });
      if (result.ok) {
        setShowForm(false);
        setDescription('');
        setPerformedBy('');
        setPartsUsed('');
        setRemarks('');
        setTasks([]);
        setPlanId('');
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Interventions</h2>
        {canWrite && !showForm && (
          <button onClick={() => setShowForm(true)} className="text-xs font-medium text-sky-600 hover:text-sky-700">
            + Nouvelle intervention
          </button>
        )}
      </div>

      {fromLogEntry && showForm && (
        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Pré-remplie depuis l&apos;incident du journal machine du {fmtDateTime(fromLogEntry.createdAt)}.
        </p>
      )}

      {showForm && (
        <div className="mt-3 space-y-3 rounded-lg border border-slate-200 p-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-500">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                <option value="PREVENTIVE">Préventive</option>
                <option value="CORRECTIVE">Corrective</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Plan lié (facultatif)</label>
              <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                <option value="">Aucun</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {equipmentLabel(p)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-500">Date/heure</label>
              <input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Heures moteur (facultatif)</label>
              <input type="number" value={engineHours} onChange={(e) => setEngineHours(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-500">Intervenant (facultatif)</label>
              <input value={performedBy} onChange={(e) => setPerformedBy(e.target.value)} placeholder="Technicien, atelier..." className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Statut</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                <option value="terminée">Terminée</option>
                <option value="en cours">En cours</option>
                <option value="planifiée">Planifiée</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500">Pièces / matériel (facultatif)</label>
            <input value={partsUsed} onChange={(e) => setPartsUsed(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Remarques (facultatif)</label>
            <input value={remarks} onChange={(e) => setRemarks(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-500">Tâches</label>
              <button onClick={addTaskRow} className="text-xs font-medium text-sky-600 hover:text-sky-700">
                + Ajouter une tâche
              </button>
            </div>
            <div className="mt-1 space-y-1.5">
              {tasks.map((task, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={task.description}
                    onChange={(e) => updateTask(i, { description: e.target.value })}
                    placeholder="Description de la tâche"
                    className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                  <label className="flex items-center gap-1 text-xs text-slate-500">
                    <input type="checkbox" checked={task.isRequired} onChange={(e) => updateTask(i, { isRequired: e.target.checked })} />
                    Obligatoire
                  </label>
                  <button onClick={() => removeTask(i)} className="text-xs text-red-500 hover:text-red-700">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={submit} disabled={isPending} className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50">
              Enregistrer
            </button>
            <button onClick={() => setShowForm(false)} className="text-xs text-slate-400 hover:text-slate-600">
              Annuler
            </button>
          </div>
        </div>
      )}

      {interventions.length === 0 && !showForm && <p className="mt-3 text-sm text-slate-400">Aucune intervention enregistrée.</p>}

      <ul className="mt-3 space-y-3">
        {interventions.map((intervention) => (
          <InterventionItem key={intervention.id} intervention={intervention} canWrite={canWrite} />
        ))}
      </ul>
    </div>
  );
}

function InterventionItem({ intervention, canWrite }: { intervention: Data['interventions'][number]; canWrite: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle(taskId: string, isDone: boolean) {
    startTransition(async () => {
      await toggleMaintenanceTask(taskId, isDone);
      router.refresh();
    });
  }

  return (
    <li className="border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0">
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            intervention.type === 'CORRECTIVE' ? 'bg-red-100 text-red-700' : 'bg-sky-100 text-sky-700'
          }`}
        >
          {MAINTENANCE_TYPE_LABEL[intervention.type]}
        </span>
        {intervention.plan && <span className="text-xs text-slate-400">{equipmentLabel(intervention.plan)}</span>}
        <span className="ml-auto font-mono text-xs text-slate-400">{fmtDateTime(intervention.occurredAt)}</span>
      </div>
      {intervention.description && <p className="mt-1">{intervention.description}</p>}
      <p className="mt-0.5 text-xs text-slate-400">
        Statut : {intervention.status}
        {intervention.performedBy && ` — Intervenant : ${intervention.performedBy}`}
        {intervention.engineHoursAtIntervention != null && ` — ${intervention.engineHoursAtIntervention} h`}
      </p>
      {intervention.partsUsed && <p className="mt-0.5 text-xs text-slate-500">Pièces : {intervention.partsUsed}</p>}
      {intervention.remarks && <p className="mt-0.5 text-xs text-slate-500">Remarques : {intervention.remarks}</p>}
      {intervention.tasks.length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {intervention.tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={task.isDone}
                disabled={!canWrite || isPending}
                onChange={(e) => toggle(task.id, e.target.checked)}
              />
              <span className={task.isDone ? 'text-slate-400 line-through' : 'text-slate-600'}>{task.description}</span>
              {task.isRequired && !task.isDone && <span className="text-red-500">*</span>}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-0.5 text-xs text-slate-400">
        Responsable : {intervention.responsible.firstName} {intervention.responsible.lastName}
      </p>
    </li>
  );
}
