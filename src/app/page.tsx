import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Logo } from '@/components/logo';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const company = await prisma.company.findFirst();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 bg-slate-900 p-8">
      <div className="flex flex-col items-center text-center">
        <Logo className="h-16 w-16 text-amber-400" />
        <h1 className="mt-4 font-serif text-4xl text-white">MyTug</h1>
        {company && <p className="mt-1 text-sky-200">{company.name}</p>}
      </div>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        <Link
          href="/tablette"
          className="flex flex-col gap-2 rounded-xl border border-slate-700 bg-slate-50 p-6 shadow-sm transition hover:border-amber-400 hover:shadow-lg"
        >
          <span className="text-lg font-semibold text-slate-900">Tablette remorqueur</span>
          <span className="text-sm text-slate-500">
            Capitaine et Chef mécanicien — identification par code PIN
          </span>
        </Link>

        <Link
          href="/connexion"
          className="flex flex-col gap-2 rounded-xl border border-slate-700 bg-slate-50 p-6 shadow-sm transition hover:border-amber-400 hover:shadow-lg"
        >
          <span className="text-lg font-semibold text-slate-900">Connexion bureau</span>
          <span className="text-sm text-slate-500">
            Administrateur, Chef d&apos;armement, Dispatcher — email et mot de passe
          </span>
        </Link>
      </div>
    </main>
  );
}
