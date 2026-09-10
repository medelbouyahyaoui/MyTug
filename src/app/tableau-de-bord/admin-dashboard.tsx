import Link from 'next/link';
import type { getAdminDashboard } from '@/lib/dashboard/actions';

type Data = Awaited<ReturnType<typeof getAdminDashboard>>;

export function AdminDashboard({ data }: { data: Data }) {
  const { company, tugCount, activeUserCount, notifications } = data;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Compagnie">
        <p className="font-medium">{company.name}</p>
        <p className="text-sm text-slate-500">{company.homePort}</p>
        <div className="mt-2 flex gap-4 text-sm">
          <span>{tugCount} remorqueur(s)</span>
          <span>{activeUserCount} utilisateur(s) actif(s)</span>
        </div>
      </Card>

      <Card title={`Notifications${notifications.length > 0 ? ` (${notifications.length})` : ''}`}>
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-400">Rien à signaler.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link href="/notifications" className="text-sky-600 hover:text-sky-700">
                  {n.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Accès rapide" className="md:col-span-2">
        <div className="flex flex-wrap gap-2">
          <Link href="/administration/utilisateurs" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
            Utilisateurs
          </Link>
          <Link href="/administration/societe" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
            Société
          </Link>
          <Link href="/administration/referentiels" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
            Référentiels
          </Link>
          <Link href="/flotte" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
            Flotte
          </Link>
          <Link href="/disponibilite" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
            Disponibilité
          </Link>
          <Link href="/rapports" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
            Rapports
          </Link>
          <Link href="/historique" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
            Historique
          </Link>
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 text-left ${className ?? ''}`}>
      <p className="mb-2 text-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}
