import Link from 'next/link';
import { listUsers } from '@/lib/users/actions';

export const dynamic = 'force-dynamic';

const ROLE_LABEL: Record<string, string> = {
  ADMINISTRATEUR: 'Administrateur',
  CHEF_ARMEMENT: "Chef d'armement",
  CHEF_MECANICIEN: 'Chef mécanicien',
  CAPITAINE: 'Capitaine',
  DISPATCHER: 'Dispatcher',
};

const PIN_ROLES = ['CAPITAINE', 'CHEF_MECANICIEN'];

export default async function UtilisateursPage() {
  const users = await listUsers();

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h1 className="text-lg font-semibold">Utilisateurs</h1>
        <Link
          href="/administration/utilisateurs/nouveau"
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Ajouter un utilisateur
        </Link>
      </div>

      <div className="p-6">
        <table className="w-full border-collapse overflow-hidden rounded-lg border border-slate-200 bg-white text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-2.5">Utilisateur</th>
              <th className="px-4 py-2.5">Rôle</th>
              <th className="px-4 py-2.5">Authentification</th>
              <th className="px-4 py-2.5">Statut</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="flex items-center gap-2 px-4 py-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                    {u.firstName[0]}
                    {u.lastName[0]}
                  </span>
                  {u.firstName} {u.lastName}
                </td>
                <td className="px-4 py-2.5">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-500">
                  {PIN_ROLES.includes(u.role) ? 'PIN tablette' : "E-mail + mot de passe"}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={
                      u.status === 'ACTIF'
                        ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700'
                        : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500'
                    }
                  >
                    {u.status === 'ACTIF' ? 'Actif' : 'Archivé'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link
                    href={`/administration/utilisateurs/${u.id}`}
                    className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Modifier
                  </Link>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Aucun utilisateur pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
