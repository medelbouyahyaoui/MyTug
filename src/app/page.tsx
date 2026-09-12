import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const company = await prisma.company.findFirst();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">MyTug</h1>
        {company && <p className="mt-1 text-slate-500">{company.name}</p>}
      </div>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        <Link
          href="/tablette"
          className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          <span className="text-lg font-semibold">Tablette remorqueur</span>
          <span className="text-sm text-slate-500">
            Capitaine et Chef mécanicien — identification par code PIN
          </span>
        </Link>

        <Link
          href="/connexion"
          className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          <span className="text-lg font-semibold">Connexion bureau</span>
          <span className="text-sm text-slate-500">
            Administrateur, Chef d&apos;armement, Dispatcher — email et mot de passe
          </span>
        </Link>
      </div>
    </main>
  );
}
