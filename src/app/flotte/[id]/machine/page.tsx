import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getMachineOverview } from '@/lib/machine/actions';
import { MachineView } from './machine-view';

export const dynamic = 'force-dynamic';

export default async function MachinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getMachineOverview(id).catch(() => null);
  if (!data) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
        <Link href={`/flotte/${id}`} className="text-slate-400 hover:text-slate-600">
          ←
        </Link>
        <h1 className="text-lg font-semibold">
          Machine — {data.tug.name} <span className="font-normal text-slate-400">· journal, heures moteur, carburant, huile</span>
        </h1>
      </div>

      <MachineView tugId={id} data={data} />
    </div>
  );
}
