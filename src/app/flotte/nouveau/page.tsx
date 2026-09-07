import Link from 'next/link';
import { listTugTypes } from '@/lib/tugs/actions';
import { NewTugForm } from './new-tug-form';

export const dynamic = 'force-dynamic';

export default async function NouveauRemorqueurPage() {
  const tugTypes = await listTugTypes();

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
        <Link href="/flotte" className="text-slate-400 hover:text-slate-600">
          ←
        </Link>
        <h1 className="text-lg font-semibold">Nouveau remorqueur</h1>
      </div>
      <div className="max-w-md p-6">
        <NewTugForm tugTypes={tugTypes} />
      </div>
    </div>
  );
}
