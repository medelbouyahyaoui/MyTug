import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { LogoutButton } from './logout-button';

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

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs uppercase tracking-widest text-slate-400">Connecté</p>
        <h1 className="mt-2 text-2xl font-bold">
          {user.firstName} {user.lastName}
        </h1>
        <p className="mt-1 text-slate-500">{ROLE_LABEL[user.role] ?? user.role}</p>
        {tug && <p className="mt-1 text-sm text-slate-400">Remorqueur : {tug.name}</p>}

        <p className="mt-6 text-sm text-slate-400">
          Le tableau de bord complet arrive au fur et à mesure de la construction des modules.
        </p>

        <LogoutButton />
      </div>
    </main>
  );
}
