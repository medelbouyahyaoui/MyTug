import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSafetyOverview } from '@/lib/safety/actions';
import { SafetyView } from './safety-view';

export const dynamic = 'force-dynamic';

export default async function SafetyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getSafetyOverview(id).catch(() => null);
  if (!data) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
        <Link href={`/flotte/${id}`} className="text-slate-400 hover:text-slate-600">
          ←
        </Link>
        <h1 className="text-lg font-semibold">
          Sécurité / ISM / ISPS <span className="font-normal text-slate-400">· observations et actions correctives</span>
        </h1>
      </div>

      <SafetyView tugId={id} data={data} />
    </div>
  );
}
