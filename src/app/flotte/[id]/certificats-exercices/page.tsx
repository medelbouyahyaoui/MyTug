import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getComplianceOverview } from '@/lib/compliance/actions';
import { ComplianceView } from './compliance-view';

export const dynamic = 'force-dynamic';

export default async function ComplianceePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { id } = await params;
  const { year: yearParam } = await searchParams;
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();

  const data = await getComplianceOverview(id, year).catch(() => null);
  if (!data) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
        <Link href={`/flotte/${id}`} className="text-slate-400 hover:text-slate-600">
          ←
        </Link>
        <h1 className="text-lg font-semibold">
          Certificats & exercices — {data.tug.name} <span className="font-normal text-slate-400">· {year}</span>
        </h1>
      </div>

      <ComplianceView tugId={id} data={data} />
    </div>
  );
}
