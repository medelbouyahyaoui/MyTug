'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { declareAssignment } from '@/lib/service/actions';
import type { Poste, PostAssignment, User } from '@prisma/client';

type Assignment = PostAssignment & { user: User };

function nowLocalInputValue() {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function CrewRow({
  tugId,
  poste,
  current,
  users,
}: {
  tugId: string;
  poste: Poste;
  current: Assignment | null;
  users: User[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState(users[0]?.id ?? '');
  const [startsAt, setStartsAt] = useState(nowLocalInputValue());
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await declareAssignment({ tugId, posteId: poste.id, userId, startsAt, reason });
      if (result.ok) {
        setOpen(false);
        setReason('');
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="w-36 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {poste.name}
        </div>
        <div className="flex flex-1 items-center gap-2">
          {current ? (
            <>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                {current.user.firstName[0]}
                {current.user.lastName[0]}
              </span>
              <div>
                <div className="text-sm font-medium">
                  {current.user.firstName} {current.user.lastName}
                </div>
                <div className="text-xs text-slate-400">
                  Depuis le {current.startsAt.toLocaleString('fr-FR')}
                </div>
              </div>
            </>
          ) : (
            <span className="text-sm text-slate-400">Poste non pourvu</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          {current ? 'Déclarer un remplacement' : 'Affecter'}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="space-y-2 bg-slate-50 px-4 py-3">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motif (facultatif)"
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending || !userId}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {isPending ? 'Enregistrement…' : 'Confirmer'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
