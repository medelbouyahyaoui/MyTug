import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function TabletteSelectionPage() {
  // Mono-compagnie : une seule compagnie existe dans cette base.
  const company = await prisma.company.findFirst();
  const tugs = company
    ? await prisma.tug.findMany({
        where: { companyId: company.id, isArchived: false },
        orderBy: { name: 'asc' },
        include: { tugType: true },
      })
    : [];

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-slate-950 p-8 text-slate-50">
      <div className="text-center">
        <p className="text-xs uppercase tracking-widest text-slate-400">MyTug</p>
        <h1 className="mt-1 text-xl font-semibold">Sélection du remorqueur</h1>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
        {tugs.map((tug) => (
          <Link
            key={tug.id}
            href={`/tablette/${tug.id}`}
            className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-6 text-center transition hover:bg-white/10"
          >
            <span className="text-lg font-semibold">{tug.name}</span>
            <span className="text-xs text-slate-400">{tug.tugType.name}</span>
          </Link>
        ))}
        {tugs.length === 0 && (
          <p className="col-span-full text-sm text-slate-400">Aucun remorqueur configuré.</p>
        )}
      </div>
    </main>
  );
}
