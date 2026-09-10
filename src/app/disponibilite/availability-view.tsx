'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateDispatchNote, type DerivedStatus } from '@/lib/availability/actions';
import type { getAvailabilityOverview } from '@/lib/availability/actions';

type Rows = Awaited<ReturnType<typeof getAvailabilityOverview>>;

const STATUS_LABEL: Record<DerivedStatus, string> = {
  DISPONIBLE: 'Disponible',
  DISPONIBLE_SANS_EQUIPAGE: 'Disponible sans équipage',
  OCCUPE: 'Occupé',
  MAINTENANCE: 'Maintenance',
  DESARME: 'Désarmé',
  ACTIVE_TEMPORAIREMENT: 'Activé temporairement',
  INDISPONIBLE: 'Indisponible',
};
const STATUS_CLASS: Record<DerivedStatus, string> = {
  DISPONIBLE: 'bg-emerald-100 text-emerald-700',
  DISPONIBLE_SANS_EQUIPAGE: 'bg-amber-100 text-amber-700',
  OCCUPE: 'bg-sky-100 text-sky-700',
  MAINTENANCE: 'bg-orange-100 text-orange-700',
  DESARME: 'bg-slate-100 text-slate-500',
  ACTIVE_TEMPORAIREMENT: 'bg-purple-100 text-purple-700',
  INDISPONIBLE: 'bg-red-100 text-red-700',
};

export function AvailabilityView({ rows, canEditNote }: { rows: Rows; canEditNote: boolean }) {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        {rows.map((row) => (
          <TugRow key={row.tug.id} row={row} canEditNote={canEditNote} />
        ))}
      </div>
    </div>
  );
}

function TugRow({ row, canEditNote }: { row: Rows[number]; canEditNote: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(row.tug.dispatchNote ?? '');

  function save() {
    startTransition(async () => {
      await updateDispatchNote(row.tug.id, note);
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <Link href={`/flotte/${row.tug.id}`} className="font-semibold hover:underline">
          {row.tug.name}
        </Link>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[row.derivedStatus]}`}>{STATUS_LABEL[row.derivedStatus]}</span>
      </div>

      <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Équipage en service</p>
          <p>Capitaine : {row.captainOnDuty ?? '—'}</p>
          <p>Chef mécanicien : {row.chefMecanicienOnDuty ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Mission active</p>
          {row.activeMission ? (
            <>
              <p>
                {row.activeMission.vesselName} — {row.activeMission.movementType.name}
              </p>
              <p className="text-xs text-slate-400">Pilote : {row.activeMission.pilot.name}</p>
            </>
          ) : (
            <p>—</p>
          )}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Annotation</p>
          {!editing ? (
            <div className="flex items-start gap-2">
              <p className="flex-1">{row.tug.dispatchNote || '—'}</p>
              {canEditNote && (
                <button onClick={() => setEditing(true)} className="text-xs font-medium text-sky-600 hover:text-sky-700">
                  Modifier
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
                placeholder="Note libre, informative"
              />
              <button onClick={save} disabled={isPending} className="text-xs font-medium text-sky-600 hover:text-sky-700 disabled:opacity-50">
                OK
              </button>
              <button onClick={() => setEditing(false)} className="text-xs text-slate-400 hover:text-slate-600">
                Annuler
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
