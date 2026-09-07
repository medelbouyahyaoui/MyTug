'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { changeTugStatus } from '@/lib/tugs/actions';
import type { TugOperationalStatus } from '@prisma/client';

const OPTIONS: { value: TugOperationalStatus; label: string }[] = [
  { value: 'DISPONIBLE', label: 'Disponible' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'DESARME', label: 'Désarmé' },
  { value: 'ACTIVE_TEMPORAIREMENT', label: 'Activer temporairement' },
  { value: 'INDISPONIBLE', label: 'Indisponible' },
];

export function TugStatusPanel({
  tugId,
  currentStatus,
}: {
  tugId: string;
  currentStatus: TugOperationalStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<TugOperationalStatus>(
    currentStatus === 'OCCUPE' ? 'DISPONIBLE' : currentStatus
  );
  const [reason, setReason] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await changeTugStatus(tugId, {
        status,
        reason: reason || undefined,
        temporaryActivationStart: start || undefined,
        temporaryActivationEnd: end || undefined,
      });
      if (result.ok) {
        setReason('');
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold">Changer le statut</h2>
      {currentStatus === 'OCCUPE' && (
        <p className="mb-3 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-700">
          Ce remorqueur est actuellement en mission — son statut est piloté automatiquement.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setStatus(o.value)}
              className={`rounded-lg border px-2 py-2 text-xs font-medium ${
                status === o.value
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {status === 'ACTIVE_TEMPORAIREMENT' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Début</label>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Fin prévue</label>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs text-slate-500">Motif</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            placeholder="Facultatif sauf pour une activation temporaire"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {isPending ? 'Enregistrement…' : 'Confirmer le changement'}
        </button>
      </form>
    </div>
  );
}
