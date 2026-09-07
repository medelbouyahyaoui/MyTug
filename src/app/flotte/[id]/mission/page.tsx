import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getMissionContext } from '@/lib/missions/actions';
import { MissionFlow } from './mission-flow';

export const dynamic = 'force-dynamic';

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tug = await prisma.tug.findUnique({ where: { id } });
  if (!tug) notFound();

  const ctx = await getMissionContext(id);

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
        <Link href={`/flotte/${id}`} className="text-slate-400 hover:text-slate-600">
          ←
        </Link>
        <h1 className="text-lg font-semibold">Mission — {tug.name}</h1>
      </div>

      <div className="p-6">
        {!ctx.service ? (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Aucun service en cours sur ce remorqueur.
          </p>
        ) : !ctx.isCaptainOnDuty && !ctx.activeMission ? (
          <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Seul le capitaine en service actif sur ce remorqueur peut créer une mission.
          </p>
        ) : (
          <MissionFlow
            tugId={id}
            activeMission={ctx.activeMission}
            pilots={ctx.pilots}
            movementTypes={ctx.movementTypes}
            tugTypes={ctx.tugTypes}
            openOperations={ctx.openOperations}
          />
        )}
      </div>
    </div>
  );
}
