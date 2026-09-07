import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { getHandoverContext } from '@/lib/service/handover';
import { LogoutButton } from './logout-button';
import { EndOfService } from './end-of-service';

const ROLE_LABEL: Record<string, string> = {
  ADMINISTRATEUR: 'Administrateur',
  CHEF_ARMEMENT: "Chef d'armement",
  CHEF_MECANICIEN: 'Chef mécanicien',
  CAPITAINE: 'Capitaine',
  DISPATCHER: 'Dispatcher',
};

export default async function TableauDeBordPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  const tug = user.tugId ? await prisma.tug.findUnique({ where: { id: user.tugId } }) : null;
  const handoverContext = tug ? await getHandoverContext(tug.id) : null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs uppercase tracking-widest text-slate-400">Connecté</p>
        <h1 className="mt-2 text-2xl font-bold">
          {user.firstName} {user.lastName}
        </h1>
        <p className="mt-1 text-slate-500">{ROLE_LABEL[user.role] ?? user.role}</p>
        {tug && <p className="mt-1 text-sm text-slate-400">Remorqueur : {tug.name}</p>}
        {tug && (
          <Link href={`/flotte/${tug.id}/machine`} className="mt-1 inline-block text-xs text-sky-600 hover:text-sky-700">
            Journal machine / heures moteur / carburant / huile →
          </Link>
        )}

        <p className="mt-6 text-sm text-slate-400">
          Le tableau de bord complet arrive au fur et à mesure de la construction des modules.
        </p>

        {tug && handoverContext && <EndOfService tugId={tug.id} context={handoverContext} />}

        {(user.role === 'ADMINISTRATEUR' || user.role === 'CHEF_ARMEMENT') && (
          <Link
            href="/administration/utilisateurs"
            className="mt-4 block rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Aller à l&apos;administration
          </Link>
        )}

        <LogoutButton />
      </div>
    </main>
  );
}
