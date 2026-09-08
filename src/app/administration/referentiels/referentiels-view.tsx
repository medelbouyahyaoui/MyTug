'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createReferentielItem, toggleReferentielArchived } from '@/lib/referentiels/actions';
import { REF_KIND_LABEL, type RefKind } from '@/lib/referentiels/constants';

type Item = { id: string; name: string; isArchived: boolean };

const KINDS = Object.keys(REF_KIND_LABEL) as RefKind[];

export function ReferentielsView({ referentiels }: { referentiels: Record<RefKind, Item[]> }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {KINDS.map((kind) => (
        <RefList key={kind} kind={kind} items={referentiels[kind]} />
      ))}
    </div>
  );
}

function RefList({ kind, items }: { kind: RefKind; items: Item[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  function add() {
    setError(null);
    if (!newName.trim()) return;
    startTransition(async () => {
      const result = await createReferentielItem(kind, newName);
      if (result.ok) {
        setNewName('');
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function toggle(id: string, isArchived: boolean) {
    startTransition(async () => {
      await toggleReferentielArchived(kind, id, !isArchived);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="mb-3 text-sm font-semibold">{REF_KIND_LABEL[kind]}</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-sm">
            <span className={item.isArchived ? 'text-slate-400 line-through' : 'text-slate-700'}>{item.name}</span>
            <button onClick={() => toggle(item.id, item.isArchived)} disabled={isPending} className="ml-auto text-xs font-medium text-sky-600 hover:text-sky-700 disabled:opacity-50">
              {item.isArchived ? 'Réactiver' : 'Archiver'}
            </button>
          </li>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400">Aucun élément.</p>}
      </ul>
      <div className="mt-3 flex gap-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nouveau nom" className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
        <button onClick={add} disabled={isPending} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          Ajouter
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
