import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getUser } from '@/lib/users/actions';
import { UserForm } from './user-form';

export const dynamic = 'force-dynamic';

export default async function FicheUtilisateurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getUser(id);
  if (!data) notFound();

  const { user, assignments } = data;
  // Ne jamais envoyer les hachages (mot de passe / PIN) au client.
  const safeUser = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    email: user.email,
  };

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
        <Link href="/administration/utilisateurs" className="text-slate-400 hover:text-slate-600">
          ←
        </Link>
        <h1 className="text-lg font-semibold">
          {user.firstName} {user.lastName}
        </h1>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <UserForm user={safeUser} />

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold">Historique des affectations</h2>
          {assignments.length === 0 && (
            <p className="text-sm text-slate-400">Aucune affectation enregistrée pour l&apos;instant.</p>
          )}
          <table className="w-full text-sm">
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-1.5 pr-2">{a.tug.name}</td>
                  <td className="py-1.5 pr-2 text-slate-500">{a.poste.name}</td>
                  <td className="py-1.5 pr-2 text-slate-400">
                    {a.startsAt.toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-1.5 text-slate-400">
                    {a.endsAt ? a.endsAt.toLocaleDateString('fr-FR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-400">
            Affectation flexible — aucun rattachement fixe à un remorqueur.
          </p>
        </div>
      </div>
    </div>
  );
}
