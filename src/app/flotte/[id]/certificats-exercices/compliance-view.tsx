'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createCertificate,
  createCertificateType,
  createExerciseType,
  generateExerciseProgram,
  recordExerciseExecution,
  type ActionResult,
  type CreateTypeResult,
  type getComplianceOverview,
} from '@/lib/compliance/actions';

type Data = Awaited<ReturnType<typeof getComplianceOverview>>;

const CERT_STATUS_LABEL: Record<string, string> = { OK: 'OK', BIENTOT: 'Bientôt', EXPIRE: 'Expiré' };
const CERT_STATUS_CLASS: Record<string, string> = {
  OK: 'bg-emerald-100 text-emerald-700',
  BIENTOT: 'bg-amber-100 text-amber-700',
  EXPIRE: 'bg-red-100 text-red-700',
};
const EX_STATUS_LABEL: Record<string, string> = {
  PREVU: 'Prévu',
  A_VENIR: 'À venir',
  REALISE: 'Réalisé',
  EN_RETARD: 'En retard',
  ANNULE: 'Annulé',
};
const EX_STATUS_CLASS: Record<string, string> = {
  PREVU: 'bg-slate-100 text-slate-600',
  A_VENIR: 'bg-amber-100 text-amber-700',
  REALISE: 'bg-emerald-100 text-emerald-700',
  EN_RETARD: 'bg-red-100 text-red-700',
  ANNULE: 'bg-slate-100 text-slate-400',
};

function fmtDate(dt: Date | string | null) {
  return dt ? new Date(dt).toLocaleDateString('fr-FR') : '—';
}

export function ComplianceView({ tugId, data }: { tugId: string; data: Data }) {
  return (
    <div className="grid gap-6 p-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <CertificatesSection tugId={tugId} data={data} />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
        <ExerciseProgramSection tugId={tugId} data={data} />
      </div>
    </div>
  );
}

function CertificatesSection({ tugId, data }: { tugId: string; data: Data }) {
  const router = useRouter();
  const { certificates, certificateTypes, canManage } = data;
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [typeId, setTypeId] = useState(certificateTypes[0]?.id ?? '');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [authority, setAuthority] = useState('');
  const [remarks, setRemarks] = useState('');
  const [newTypeName, setNewTypeName] = useState('');
  const [error, setError] = useState<string | null>(null);

  function addType() {
    if (!newTypeName.trim()) return;
    startTransition(async () => {
      const result: CreateTypeResult = await createCertificateType(newTypeName);
      if (result.ok) {
        setNewTypeName('');
        setTypeId(result.id);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function submit() {
    setError(null);
    if (!typeId) {
      setError('Type requis.');
      return;
    }
    startTransition(async () => {
      const result: ActionResult = await createCertificate({
        tugId,
        typeId,
        referenceNumber: referenceNumber || undefined,
        issuedAt: issuedAt || undefined,
        expiresAt: expiresAt || undefined,
        authority: authority || undefined,
        remarks: remarks || undefined,
      });
      if (result.ok) {
        setShowForm(false);
        setReferenceNumber('');
        setIssuedAt('');
        setExpiresAt('');
        setAuthority('');
        setRemarks('');
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Certificats</h2>
        {canManage && !showForm && (
          <button onClick={() => setShowForm(true)} className="text-xs font-medium text-sky-600 hover:text-sky-700">
            + Nouveau certificat
          </button>
        )}
      </div>

      {showForm && (
        <div className="mt-3 space-y-2 rounded-lg border border-slate-200 p-4">
          <div>
            <label className="block text-xs font-medium text-slate-500">Type</label>
            <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
              {certificateTypes.length === 0 && <option value="">Aucun type configuré</option>}
              {certificateTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <div className="mt-1.5 flex gap-2">
              <input
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="+ Ajouter un type au référentiel"
                className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs"
              />
              <button onClick={addType} className="text-xs font-medium text-sky-600 hover:text-sky-700">
                Ajouter
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500">Numéro de référence (facultatif)</label>
            <input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-500">Délivré le</label>
              <input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Expire le</label>
              <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Autorité (facultatif)</label>
            <input value={authority} onChange={(e) => setAuthority(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Remarques (facultatif)</label>
            <input value={remarks} onChange={(e) => setRemarks(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={submit} disabled={isPending} className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50">
              Créer
            </button>
            <button onClick={() => setShowForm(false)} className="text-xs text-slate-400 hover:text-slate-600">
              Annuler
            </button>
          </div>
        </div>
      )}

      {certificates.length === 0 && !showForm && <p className="mt-3 text-sm text-slate-400">Aucun certificat.</p>}

      <ul className="mt-3 space-y-3">
        {certificates.map((c) => (
          <li key={c.id} className="border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{c.type.name}</span>
              {c.status && <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CERT_STATUS_CLASS[c.status]}`}>{CERT_STATUS_LABEL[c.status]}</span>}
              <span className="ml-auto text-xs text-slate-400">{c.referenceNumber}</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Délivré le {fmtDate(c.issuedAt)} — Expire le {fmtDate(c.expiresAt)}
              {c.authority && ` — ${c.authority}`}
            </p>
            {c.remarks && <p className="mt-0.5 text-xs text-slate-500">{c.remarks}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExerciseProgramSection({ tugId, data }: { tugId: string; data: Data }) {
  const router = useRouter();
  const { year, exerciseTypes, captains, gridTypes, gridCaptains, entries, myPendingEntries, canManage, isCaptain } = data;
  const [isPending, startTransition] = useTransition();
  const [showGenForm, setShowGenForm] = useState(false);
  const [selectedCaptainIds, setSelectedCaptainIds] = useState<string[]>([]);
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [genError, setGenError] = useState<string | null>(null);

  function toggleCaptain(id: string) {
    setSelectedCaptainIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  function toggleType(id: string) {
    setSelectedTypeIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function addType() {
    if (!newTypeName.trim()) return;
    startTransition(async () => {
      const result: CreateTypeResult = await createExerciseType(newTypeName);
      if (result.ok) {
        setNewTypeName('');
        setSelectedTypeIds((s) => [...s, result.id]);
        router.refresh();
      } else {
        setGenError(result.error);
      }
    });
  }

  function generate() {
    setGenError(null);
    startTransition(async () => {
      const result: ActionResult = await generateExerciseProgram({ tugId, year, captainIds: selectedCaptainIds, typeIds: selectedTypeIds });
      if (result.ok) {
        setShowGenForm(false);
        setSelectedCaptainIds([]);
        setSelectedTypeIds([]);
        router.refresh();
      } else {
        setGenError(result.error);
      }
    });
  }

  function cell(typeId: string, captainId: string) {
    return entries.find((e) => e.typeId === typeId && e.captainId === captainId);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Planning annuel des exercices — {year}</h2>
        <div className="flex items-center gap-3">
          <a href={`?year=${year - 1}`} className="text-xs text-slate-400 hover:text-slate-600">
            ← {year - 1}
          </a>
          <a href={`?year=${year + 1}`} className="text-xs text-slate-400 hover:text-slate-600">
            {year + 1} →
          </a>
          {canManage && !showGenForm && (
            <button onClick={() => setShowGenForm(true)} className="text-xs font-medium text-sky-600 hover:text-sky-700">
              + Générer le programme
            </button>
          )}
        </div>
      </div>

      {showGenForm && (
        <div className="mt-3 space-y-3 rounded-lg border border-slate-200 p-4">
          <div>
            <label className="block text-xs font-medium text-slate-500">Capitaines</label>
            <div className="mt-1 flex flex-wrap gap-3">
              {captains.map((c) => (
                <label key={c.id} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={selectedCaptainIds.includes(c.id)} onChange={() => toggleCaptain(c.id)} />
                  {c.firstName} {c.lastName}
                </label>
              ))}
              {captains.length === 0 && <p className="text-xs text-slate-400">Aucun capitaine actif.</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Types d&apos;exercice</label>
            <div className="mt-1 flex flex-wrap gap-3">
              {exerciseTypes.map((t) => (
                <label key={t.id} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={selectedTypeIds.includes(t.id)} onChange={() => toggleType(t.id)} />
                  {t.name}
                </label>
              ))}
              {exerciseTypes.length === 0 && <p className="text-xs text-slate-400">Aucun type configuré.</p>}
            </div>
            <div className="mt-1.5 flex gap-2">
              <input
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="+ Ajouter un type au référentiel"
                className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs"
              />
              <button onClick={addType} className="text-xs font-medium text-sky-600 hover:text-sky-700">
                Ajouter
              </button>
            </div>
          </div>
          {genError && <p className="text-xs text-red-600">{genError}</p>}
          <div className="flex gap-2">
            <button onClick={generate} disabled={isPending} className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50">
              Générer
            </button>
            <button onClick={() => setShowGenForm(false)} className="text-xs text-slate-400 hover:text-slate-600">
              Annuler
            </button>
          </div>
        </div>
      )}

      {gridTypes.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">Aucun programme généré pour {year}.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-1.5 pr-3">Exercice</th>
                {gridCaptains.map((c) => (
                  <th key={c.id} className="py-1.5 pr-3">
                    {c.firstName} {c.lastName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gridTypes.map((type) => (
                <tr key={type.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-1.5 pr-3 font-medium">{type.name}</td>
                  {gridCaptains.map((captain) => {
                    const entry = cell(type.id, captain.id);
                    return (
                      <td key={captain.id} className="py-1.5 pr-3">
                        {entry ? (
                          <div>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${EX_STATUS_CLASS[entry.displayStatus]}`}>
                              {EX_STATUS_LABEL[entry.displayStatus]}
                            </span>
                            <p className="mt-0.5 text-xs text-slate-400">{fmtDate(entry.execution?.actualDate ?? entry.plannedAt)}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isCaptain && <ExecuteExercise pendingEntries={myPendingEntries} />}
    </div>
  );
}

function ExecuteExercise({ pendingEntries }: { pendingEntries: Data['myPendingEntries'] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [programEntryId, setProgramEntryId] = useState(pendingEntries[0]?.id ?? '');
  const [actualDate, setActualDate] = useState(new Date().toISOString().slice(0, 10));
  const [participants, setParticipants] = useState('');
  const [result, setResult] = useState('');
  const [observations, setObservations] = useState('');
  const [correctiveActions, setCorrectiveActions] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (pendingEntries.length === 0) return null;

  function submit() {
    setError(null);
    if (!programEntryId) {
      setError('Sélectionnez un exercice.');
      return;
    }
    startTransition(async () => {
      const result_: ActionResult = await recordExerciseExecution({
        programEntryId,
        actualDate,
        participants: participants || undefined,
        result: result || undefined,
        observations: observations || undefined,
        correctiveActions: correctiveActions || undefined,
      });
      if (result_.ok) {
        setShowForm(false);
        setParticipants('');
        setResult('');
        setObservations('');
        setCorrectiveActions('');
        router.refresh();
      } else {
        setError(result_.error);
      }
    });
  }

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Mes exercices à réaliser sur ce remorqueur</h3>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="text-xs font-medium text-sky-600 hover:text-sky-700">
            + Enregistrer une exécution
          </button>
        )}
      </div>

      {showForm && (
        <div className="mt-3 space-y-2 rounded-lg border border-slate-200 p-4">
          <div>
            <label className="block text-xs font-medium text-slate-500">Exercice</label>
            <select value={programEntryId} onChange={(e) => setProgramEntryId(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
              {pendingEntries.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.type.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Date réelle</label>
            <input type="date" value={actualDate} onChange={(e) => setActualDate(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Participants (facultatif)</label>
            <input value={participants} onChange={(e) => setParticipants(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Résultat (facultatif)</label>
            <input value={result} onChange={(e) => setResult(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Observations (facultatif)</label>
            <textarea value={observations} onChange={(e) => setObservations(e.target.value)} rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Actions correctives (facultatif)</label>
            <input value={correctiveActions} onChange={(e) => setCorrectiveActions(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
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
    </div>
  );
}
