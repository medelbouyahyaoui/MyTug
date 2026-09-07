'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createSafetyObservation,
  submitSafetyObservation,
  validateSafetyObservation,
  createCorrectiveAction,
  toggleCorrectiveActionStatus,
  createSafetyContestation,
  type ActionResult,
  type getSafetyOverview,
} from '@/lib/safety/actions';

type Data = Awaited<ReturnType<typeof getSafetyOverview>>;
type Observation = Data['observations'][number];

const STATUS_LABEL: Record<string, string> = { BROUILLON: 'Brouillon', SOUMIS: 'Soumis', VALIDE: 'Validé' };
const STATUS_CLASS: Record<string, string> = {
  BROUILLON: 'bg-slate-100 text-slate-600',
  SOUMIS: 'bg-amber-100 text-amber-700',
  VALIDE: 'bg-emerald-100 text-emerald-700',
};

function fmtDateTime(dt: Date | string) {
  return new Date(dt).toLocaleString('fr-FR');
}
function fmtDate(dt: Date | string | null) {
  return dt ? new Date(dt).toLocaleDateString('fr-FR') : '—';
}

export function SafetyView({ tugId, data }: { tugId: string; data: Data }) {
  const { observations, canCreate, canValidate, currentUserId } = data;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (!description.trim()) {
      setError('Description requise.');
      return;
    }
    startTransition(async () => {
      const result: ActionResult = await createSafetyObservation({ tugId, description });
      if (result.ok) {
        setDescription('');
        setShowForm(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Observations & incidents</h2>
          {canCreate && !showForm && (
            <button onClick={() => setShowForm(true)} className="text-xs font-medium text-sky-600 hover:text-sky-700">
              + Nouvelle observation
            </button>
          )}
        </div>

        {showForm && (
          <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-white p-4">
            <label className="block text-xs font-medium text-slate-500">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              placeholder="Observation, incident, situation ISM/ISPS..."
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button onClick={submit} disabled={isPending} className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50">
                Enregistrer en brouillon
              </button>
              <button onClick={() => setShowForm(false)} className="text-xs text-slate-400 hover:text-slate-600">
                Annuler
              </button>
            </div>
          </div>
        )}

        {observations.length === 0 && !showForm && <p className="mt-3 text-sm text-slate-400">Aucune observation.</p>}

        <ul className="mt-4 space-y-4">
          {observations.map((o) => (
            <ObservationItem key={o.id} observation={o} canValidate={canValidate} currentUserId={currentUserId} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function ObservationItem({
  observation,
  canValidate,
  currentUserId,
}: {
  observation: Observation;
  canValidate: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showActionForm, setShowActionForm] = useState(false);
  const [actionDescription, setActionDescription] = useState('');
  const [actionResponsible, setActionResponsible] = useState('');
  const [actionDueDate, setActionDueDate] = useState('');
  const [showContestForm, setShowContestForm] = useState(false);
  const [contestedItem, setContestedItem] = useState('');
  const [contestReason, setContestReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isAuthor = observation.authorId === currentUserId;
  const canAct = isAuthor || canValidate;

  function submitAction() {
    setError(null);
    if (!actionDescription.trim()) {
      setError('Description requise.');
      return;
    }
    startTransition(async () => {
      const result: ActionResult = await createCorrectiveAction({
        safetyObservationId: observation.id,
        description: actionDescription,
        responsible: actionResponsible || undefined,
        dueDate: actionDueDate || undefined,
      });
      if (result.ok) {
        setActionDescription('');
        setActionResponsible('');
        setActionDueDate('');
        setShowActionForm(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function submitContest() {
    setError(null);
    if (!contestedItem.trim() || !contestReason.trim()) {
      setError('Élément contesté et motif requis.');
      return;
    }
    startTransition(async () => {
      const result: ActionResult = await createSafetyContestation({
        safetyObservationId: observation.id,
        contestedItem,
        reason: contestReason,
      });
      if (result.ok) {
        setContestedItem('');
        setContestReason('');
        setShowContestForm(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function submitObservation() {
    startTransition(async () => {
      await submitSafetyObservation(observation.id);
      router.refresh();
    });
  }

  function validateObservation() {
    startTransition(async () => {
      await validateSafetyObservation(observation.id);
      router.refresh();
    });
  }

  function toggleAction(id: string, currentStatus: string) {
    const next = currentStatus === 'ouverte' ? 'terminée' : 'ouverte';
    startTransition(async () => {
      await toggleCorrectiveActionStatus(id, next);
      router.refresh();
    });
  }

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[observation.status]}`}>{STATUS_LABEL[observation.status]}</span>
        <span className="ml-auto font-mono text-xs text-slate-400">{fmtDateTime(observation.createdAt)}</span>
      </div>
      <p className="mt-1.5">{observation.description}</p>
      <p className="mt-1 text-xs text-slate-400">
        Par {observation.author.firstName} {observation.author.lastName}
        {observation.validatedBy && ` — Validé par ${observation.validatedBy.firstName} ${observation.validatedBy.lastName} le ${fmtDateTime(observation.validatedAt!)}`}
      </p>

      <div className="mt-2 flex gap-3">
        {isAuthor && observation.status === 'BROUILLON' && (
          <button onClick={submitObservation} disabled={isPending} className="text-xs font-medium text-sky-600 hover:text-sky-700">
            Soumettre pour validation
          </button>
        )}
        {canValidate && observation.status === 'SOUMIS' && (
          <button onClick={validateObservation} disabled={isPending} className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
            Valider
          </button>
        )}
      </div>

      {observation.correctiveActions.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-2">
          {observation.correctiveActions.map((a) => (
            <li key={a.id} className="flex items-center gap-2 text-xs">
              <button
                onClick={() => canAct && toggleAction(a.id, a.status)}
                disabled={!canAct || isPending}
                className={`rounded-full px-2 py-0.5 font-medium ${a.status === 'terminée' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
              >
                {a.status}
              </button>
              <span className={a.status === 'terminée' ? 'text-slate-400 line-through' : 'text-slate-600'}>{a.description}</span>
              {a.responsible && <span className="text-slate-400">— {a.responsible}</span>}
              {a.dueDate && <span className="text-slate-400">— échéance {fmtDate(a.dueDate)}</span>}
            </li>
          ))}
        </ul>
      )}

      {canAct && (
        <div className="mt-2">
          {!showActionForm ? (
            <button onClick={() => setShowActionForm(true)} className="text-xs font-medium text-sky-600 hover:text-sky-700">
              + Action corrective
            </button>
          ) : (
            <div className="mt-2 space-y-1.5 rounded-md border border-slate-100 p-3">
              <input
                value={actionDescription}
                onChange={(e) => setActionDescription(e.target.value)}
                placeholder="Description"
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
              />
              <div className="flex gap-2">
                <input
                  value={actionResponsible}
                  onChange={(e) => setActionResponsible(e.target.value)}
                  placeholder="Responsable (facultatif)"
                  className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
                />
                <input
                  type="date"
                  value={actionDueDate}
                  onChange={(e) => setActionDueDate(e.target.value)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={submitAction} disabled={isPending} className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50">
                  Ajouter
                </button>
                <button onClick={() => setShowActionForm(false)} className="text-xs text-slate-400 hover:text-slate-600">
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {observation.contestations.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-xs text-amber-700">
          {observation.contestations.map((c) => (
            <li key={c.id}>
              Contesté : {c.contestedItem} — {c.reason} ({c.status === 'OUVERTE' ? 'ouverte' : 'résolue'})
            </li>
          ))}
        </ul>
      )}

      {canAct && observation.status === 'VALIDE' && (
        <div className="mt-2">
          {!showContestForm ? (
            <button onClick={() => setShowContestForm(true)} className="text-xs font-medium text-sky-600 hover:text-sky-700">
              Contester un élément
            </button>
          ) : (
            <div className="mt-2 space-y-1.5 rounded-md border border-slate-100 p-3">
              <input
                value={contestedItem}
                onChange={(e) => setContestedItem(e.target.value)}
                placeholder="Élément contesté"
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
              />
              <input
                value={contestReason}
                onChange={(e) => setContestReason(e.target.value)}
                placeholder="Motif"
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
              />
              <div className="flex gap-2">
                <button onClick={submitContest} disabled={isPending} className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50">
                  Envoyer
                </button>
                <button onClick={() => setShowContestForm(false)} className="text-xs text-slate-400 hover:text-slate-600">
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </li>
  );
}
