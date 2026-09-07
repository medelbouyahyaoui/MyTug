'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTug } from '@/lib/tugs/actions';

export function NewTugForm({ tugTypes }: { tugTypes: { id: string; name: string }[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [tugTypeId, setTugTypeId] = useState(tugTypes[0]?.id ?? '');
  const [internalCode, setInternalCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createTug({ name, tugTypeId, internalCode });
      if (result.ok) router.push('/flotte');
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
        <select
          value={tugTypeId}
          onChange={(e) => setTugTypeId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {tugTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {tugTypes.length === 0 && (
          <p className="mt-1 text-xs text-amber-600">
            Aucun type de remorqueur configuré — ajoutez-en un dans les référentiels.
          </p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Identifiant interne <span className="text-slate-400">(facultatif)</span>
        </label>
        <input
          value={internalCode}
          onChange={(e) => setInternalCode(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending || !tugTypeId}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? 'Création…' : 'Créer le remorqueur'}
      </button>
    </form>
  );
}
