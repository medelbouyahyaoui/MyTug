import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { getHandoverContext } from '@/lib/service/handover';
import { getUnreadNotificationCount } from '@/lib/notifications/actions';
import { getCaptainDashboard, getChefMecanicienDashboard, getChefArmementDashboard, getAdminDashboard } from '@/lib/dashboard/actions';
import { LogoutButton } from './logout-button';
import { EndOfService } from './end-of-service';
import { CaptainDashboard } from './captain-dashboard';
import { ChefMecanicienDashboard } from './chef-mecanicien-dashboard';
import { ChefArmementDashboard } from './chef-armement-dashboard';
import { AdminDashboard } from './admin-dashboard';

export const dynamic = 'force-dynamic';

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
  const unreadCount = await getUnreadNotificationCount();

  return (
    <main className="flex-1 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">Connecté</p>
            <h1 className="text-xl font-bold">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-sm text-slate-500">
              {ROLE_LABEL[user.role] ?? user.role}
              {tug && ` — ${tug.name}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/notifications" className="text-xs font-medium text-sky-600 hover:text-sky-700">
              Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''} →
            </Link>
            <LogoutButton />
          </div>
        </div>

        {tug && handoverContext && handoverContext.hasOpenAssignment && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
            <EndOfService tugId={tug.id} context={handoverContext} />
          </div>
        )}

        <div className="mt-4">
          {user.role === 'CAPITAINE' && tug && <CaptainDashboard data={await getCaptainDashboard(tug.id)} />}
          {user.role === 'CHEF_MECANICIEN' && tug && <ChefMecanicienDashboard data={await getChefMecanicienDashboard(tug.id)} />}
          {user.role === 'CHEF_ARMEMENT' && <ChefArmementDashboard data={await getChefArmementDashboard()} />}
          {user.role === 'ADMINISTRATEUR' && <AdminDashboard data={await getAdminDashboard()} />}
          {user.role === 'DISPATCHER' && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
              Tableau de bord Dispatcher non activé pour cette compagnie.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
