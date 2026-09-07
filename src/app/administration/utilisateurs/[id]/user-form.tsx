'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  updateUser,
  resetPassword,
  resetPin,
  archiveUser,
  reactivateUser,
  deleteUser,
} from '@/lib/users/actions';
import type { UserRole, UserStatus } from '@prisma/client';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'CAPITAINE', label: 'Capitaine' },
  { value: 'CHEF_MECANICIEN', label: 'Chef mécanicien' },
  { value: 'CHEF_ARMEMENT', label: "Chef d'armement" },
  { value: 'DISPATCHER', label: 'Dispatcher' },
  { value: 'ADMINISTRATEUR', label: 'Administrateur' },
];

const PIN_ROLES: UserRole[] = ['CAPITAINE', 'CHEF_MECANICIEN'];

type UserProp = {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  email: string | null;
};

export function UserForm({ user }: { user: UserProp }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [role, setRole] = useState<UserRole>(user.role);
  const [secret, setSecret] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isPinRole = PIN_ROLES.includes(role);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await updateUser(user.id, { firstName, lastName, role });
      if (result.ok) setMessage('Modifications enregistrées.');
      else setError(result.error);
    });
  }

  function handleResetSecret() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = isPinRole ? await resetPin(user.id, secret) : await resetPassword(user.id, secret);
      if (result.ok) {
        setMessage(isPinRole ? 'Code PIN réinitialisé.' : 'Mot de passe réinitialisé.');
        setSecret('');
      } else {
        setError(result.error);
      }
    });
  }

  function handleArchive() {
    startTransition(async () => {
      await archiveUser(user.id);
      router.refresh();
    });
  }
  function handleReactivate() {
    startTransition(async () => {
      await reactivateUser(user.id);
      router.refresh();
    });
  }
  function handleDelete() {
    startTransition(async () => {
      const result = await deleteUser(user.id);
      if (result.ok) router.push('/administration/utilisateurs');
      else setError(result.error);
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Prénom</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Rôle</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
          <span className="text-slate-500">Compte</span>
          <span
            className={
              user.status === 'ACTIF' ? 'font-medium text-emerald-700' : 'font-medium text-slate-500'
            }
          >
            {user.status === 'ACTIF' ? 'Actif' : 'Archivé'}
          </span>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          Enregistrer
        </button>
      </form>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <p className="mb-2 text-sm font-medium text-slate-700">
          {isPinRole ? 'Réinitialiser le code PIN' : 'Réinitialiser le mot de passe'}
        </p>
        <div className="flex gap-2">
          <input
            type={isPinRole ? 'text' : 'password'}
            inputMode={isPinRole ? 'numeric' : undefined}
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={isPinRole ? '4 à 6 chiffres' : '8 caractères minimum'}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleResetSecret}
            disabled={isPending || !secret}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {(error || message) && (
        <p className={`mt-3 text-sm ${error ? 'text-red-600' : 'text-emerald-700'}`}>
          {error ?? message}
        </p>
      )}

      <div className="mt-5 flex gap-2 border-t border-slate-200 pt-4">
        {user.status === 'ACTIF' ? (
          <button
            type="button"
            onClick={handleArchive}
            disabled={isPending}
            className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
          >
            Archiver ce compte
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleReactivate}
              disabled={isPending}
              className="rounded-lg border border-emerald-300 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
            >
              Réactiver
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Supprimer définitivement
            </button>
          </>
        )}
      </div>
    </div>
  );
}
