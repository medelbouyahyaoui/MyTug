import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getMaintenanceOverview } from '@/lib/maintenance/actions';
import { MaintenanceView } from './maintenance-view';

export const dynamic = 'force-dynamic';

export default async function MaintenancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fromLog?: string }>;
}) {
  const { id } = await params;
  const { fromLog } = await searchParams;
  const data = await getMaintenanceOverview(id).catch(() => null);
  if (!data) notFound();

  const fromLogEntry = fromLog
    ? await prisma.machineLogEntry.findUnique({ where: { id: fromLog } })
    : null;

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
        <Link href={`/flotte/${id}`} className="text-slate-400 hover:text-slate-600">
          ←
        </Link>
        <h1 className="text-lg font-semibold">
          Maintenance — {data.tug.name} <span className="font-normal text-slate-400">· préventive et corrective</span>
        </h1>
      </div>

      <MaintenanceView tugId={id} data={data} fromLogEntry={fromLogEntry} />
    </div>
  );
}
