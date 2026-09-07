'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitHandover, createHandoverContestation, type ActionResult } from '@/lib/service/handover';
import { logout } from '@/lib/auth/actions';
import type { getHandoverContext } from '@/lib/service/handover';

type Context = Awaited<ReturnType<typeof getHandoverContext>>;

function fmt(dt: Date | string) {
  return new Date(dt).toLocaleString('fr-FR');
}

export function EndOfService({ tugId, context }: { tugId: string; context: Context }) {
  const { kind, hasOpenAssignment, engines, lastDeclaration } = context;
  if (!kind || !hasOpenAssignment) return null;

  return (
    <div className="mt-6 space-y-4 border-t border-slate-200 pt-6 text-left">
      {lastDeclaration && <ReceivedDeclaration declaration={lastDeclaration} />}
      <HandoverForm tugId={tugId} kind={kind} engines={engines} />
    </div>
  );
}

function ReceivedDeclaration({ declaration }: { declaration: NonNullable<Context['lastDeclaration']> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showContest, setShowContest] = useState(false);
  const [contestedItem, setContestedItem] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submitContest() {
    setError(null);
    if (!contestedItem.trim() || !reason.trim()) {
      setError('Élément contesté et motif requis.');
      return;
    }
    startTransition(async () => {
      const result: ActionResult = await createHandoverContestation({
        handoverDeclarationId: declaration.id,
        contestedItem,
        reason,
      });
      if (result.ok) {
        setContestedItem('');
        setReason('');
        setShowContest(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Déclaration de relève reçue</p>
      <p className="mt-1 text-xs text-slate-400">
        De {declaration.user.firstName} {declaration.user.lastName} — {fmt(declaration.createdAt)}
      </p>
      {declaration.kind === 'CHEF_MECANICIEN' && (
        <ul className="mt-2 space-y-0.5">
          {declaration.fuelRemainingT != null && <li>Carburant : {declaration.fuelRemainingT} t</li>}
          {declaration.oilRemainingL != null && <li>Huile : {declaration.oilRemainingL} L</li>}
          {declaration.technicalState && <li>État technique : {declaration.technicalState}</li>}
        </ul>
      )}
      {declaration.remarks && <p className="mt-2 italic text-slate-600">« {declaration.remarks} »</p>}

      {declaration.contestations.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-slate-200 pt-2 text-xs text-amber-700">
          {declaration.contestations.map((c) => (
            <li key={c.id}>
              Contesté : {c.contestedItem} — {c.reason} ({c.status === 'OUVERTE' ? 'ouverte' : 'résolue'})
            </li>
          ))}
        </ul>
      )}

      {!showContest ? (
        <button onClick={() => setShowContest(true)} className="mt-2 text-xs font-medium text-sky-600 hover:text-sky-700">
          Contester un élément
        </button>
      ) : (
        <div className="mt-2 space-y-2">
          <input
            value={contestedItem}
            onChange={(e) => setContestedItem(e.target.value)}
            placeholder="Élément contesté (ex: Carburant, Moteur principal 1...)"
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
          />
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motif"
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={submitContest}
              disabled={isPending}
              className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Envoyer
            </button>
            <button onClick={() => setShowContest(false)} className="text-xs text-slate-400 hover:text-slate-600">
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HandoverForm({ tugId, kind, engines }: { tugId: string; kind: 'CAPITAINE' | 'CHEF_MECANICIEN'; engines: Context['engines'] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [fuel, setFuel] = useState('');
  const [oil, setOil] = useState('');
  const [technicalState, setTechnicalState] = useState('');
  const [hours, setHours] = useState<Record<string, string>>({});
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const result: ActionResult = await submitHandover({
        tugId,
        fuelRemainingT: kind === 'CHEF_MECANICIEN' && fuel ? Number(fuel) : undefined,
        oilRemainingL: kind === 'CHEF_MECANICIEN' && oil ? Number(oil) : undefined,
        technicalState: kind === 'CHEF_MECANICIEN' ? technicalState || undefined : undefined,
        engineHourReadings:
          kind === 'CHEF_MECANICIEN'
            ? engines
                .filter((e) => hours[e.id])
                .map((e) => ({ engineId: e.id, hours: Number(hours[e.id]) }))
            : undefined,
        remarks: remarks || undefined,
      });
      if (result.ok) {
        await logout();
        router.push('/');
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Terminer le service
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-semibold">Déclaration de relève</p>

      {kind === 'CHEF_MECANICIEN' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500">Carburant restant (t)</label>
              <input
                type="number"
                step="0.01"
                value={fuel}
                onChange={(e) => setFuel(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Huile restante (L)</label>
              <input
                type="number"
                step="0.01"
                value={oil}
                onChange={(e) => setOil(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          {engines.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-500">Heures moteur</label>
              <div className="mt-1 space-y-1.5">
                {engines.map((engine) => (
                  <div key={engine.id} className="flex items-center gap-2">
                    <span className="w-40 truncate text-xs text-slate-500">{engine.label}</span>
                    <input
                      type="number"
                      step="0.1"
                      placeholder={`${engine.currentHours} h actuellement`}
                      value={hours[engine.id] ?? ''}
                      onChange={(e) => setHours((h) => ({ ...h, [engine.id]: e.target.value }))}
                      className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-500">État technique</label>
            <input
              value={technicalState}
              onChange={(e) => setTechnicalState(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-500">
          {kind === 'CAPITAINE' ? 'Remarques / consignes' : 'Remarques'}
        </label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={isPending}
          className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Valider et se déconnecter
        </button>
        <button onClick={() => setShowForm(false)} className="text-sm text-slate-400 hover:text-slate-600">
          Annuler
        </button>
      </div>
    </div>
  );
}
