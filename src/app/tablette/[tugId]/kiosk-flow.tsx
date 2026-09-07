'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginWithPin } from '@/lib/auth/actions';
import type { UserRole } from '@prisma/client';

type KioskUser = {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole; // en pratique toujours CAPITAINE ou CHEF_MECANICIEN, filtré par listKioskUsers
};

const ROLE_LABEL: Partial<Record<UserRole, string>> = {
  CAPITAINE: 'Capitaine',
  CHEF_MECANICIEN: 'Chef mécanicien',
};

function initials(u: KioskUser) {
  return `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase();
}

export function KioskFlow({ tug, users }: { tug: { id: string; name: string }; users: KioskUser[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<KioskUser | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function pressDigit(d: string) {
    if (pin.length >= 6) return;
    setError(null);
    setPin((p) => p + d);
  }
  function backspace() {
    setError(null);
    setPin((p) => p.slice(0, -1));
  }
  function reset() {
    setSelected(null);
    setPin('');
    setError(null);
  }

  function submit(pinValue: string) {
    if (!selected) return;
    startTransition(async () => {
      const result = await loginWithPin(selected.id, pinValue, tug.id);
      if (result.ok) {
        router.push('/tableau-de-bord');
        router.refresh();
      } else {
        setError(result.error);
        setPin('');
      }
    });
  }

  return (
    <main className="flex flex-1 flex-col items-center bg-slate-950 px-6 py-10 text-slate-50">
      <div className="flex w-full max-w-2xl items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">MyTug · Remorqueur</p>
          <h1 className="text-xl font-semibold">{tug.name}</h1>
        </div>
        <Link href="/tablette" className="text-xs text-slate-400 hover:text-slate-200">
          ← Changer de remorqueur
        </Link>
      </div>

      {!selected && (
        <div className="mt-10 grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelected(u)}
              className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 font-semibold">
                {initials(u)}
              </span>
              <span className="text-sm font-medium">
                {u.firstName} {u.lastName}
              </span>
              <span className="text-xs uppercase tracking-wide text-slate-400">{ROLE_LABEL[u.role] ?? u.role}</span>
            </button>
          ))}
          {users.length === 0 && (
            <p className="col-span-full text-sm text-slate-400">Aucun capitaine ou chef mécanicien actif.</p>
          )}
        </div>
      )}

      {selected && (
        <div className="mt-10 flex w-full max-w-xs flex-col items-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-600 text-lg font-semibold">
            {initials(selected)}
          </span>
          <p className="mt-3 font-medium">
            {selected.firstName} {selected.lastName}
          </p>
          <p className="text-xs text-slate-400">Entrez votre code PIN</p>

          <div className="mt-6 flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <span
                key={i}
                className={`h-3.5 w-3.5 rounded-full border-2 border-slate-500 ${
                  i < pin.length ? 'border-sky-400 bg-sky-400' : ''
                }`}
              />
            ))}
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <div className="mt-6 grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button
                key={d}
                type="button"
                disabled={isPending}
                onClick={() => {
                  const next = pin + d;
                  pressDigit(d);
                  if (next.length === 4) submit(next);
                }}
                className="h-14 w-14 rounded-xl border border-white/10 bg-white/5 text-lg font-semibold transition hover:bg-white/10 disabled:opacity-50"
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={reset}
              className="h-14 w-14 rounded-xl border border-white/10 bg-white/5 text-xs transition hover:bg-white/10"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                const next = pin + '0';
                pressDigit('0');
                if (next.length === 4) submit(next);
              }}
              className="h-14 w-14 rounded-xl border border-white/10 bg-white/5 text-lg font-semibold transition hover:bg-white/10 disabled:opacity-50"
            >
              0
            </button>
            <button
              type="button"
              onClick={backspace}
              className="h-14 w-14 rounded-xl border border-white/10 bg-white/5 text-xs transition hover:bg-white/10"
            >
              ⌫
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
