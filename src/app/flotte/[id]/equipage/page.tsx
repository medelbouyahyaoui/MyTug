import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCrewForTug, listAssignableUsers } from '@/lib/service/actions';
import { CrewRow } from './crew-row';

export const dynamic = 'force-dynamic';

export default async function EquipagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tug = await prisma.tug.findUnique({ where: { id } });
  if (!tug) notFound();

  const { service, postes, assignments } = await getCrewForTug(id);
  const users = await listAssignableUsers();

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
        <Link href={`/flotte/${id}`} className="text-slate-400 hover:text-slate-600">
          ←
        </Link>
        <h1 className="text-lg font-semibold">Équipage en service — {tug.name}</h1>
      </div>

      <div className="p-6">
        {!service ? (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Aucun service en cours sur ce remorqueur. La prise de service se fait sur la tablette du
            remorqueur (Capitaine ou Chef mécanicien).
          </p>
        ) : (
          <>
            <div className="mb-4 rounded-lg bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
              Service en cours depuis le{' '}
              {(service.actualStart ?? service.plannedStart).toLocaleString('fr-FR')}
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {postes.map((poste) => {
                const current = assignments.find((a) => a.posteId === poste.id);
                return (
                  <CrewRow
                    key={poste.id}
                    tugId={id}
                    poste={poste}
                    current={current ?? null}
                    users={users}
                  />
                );
              })}
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Seuls le capitaine de ce service et le chef d&apos;armement peuvent déclarer une
              affectation ou un remplacement, y compris pour les postes techniques.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
