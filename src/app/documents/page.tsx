import { getDocumentsOverview } from '@/lib/documents/actions';
import { DocumentsView } from './documents-view';

export const dynamic = 'force-dynamic';

export default async function DocumentsPage() {
  const data = await getDocumentsOverview();

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
        <h1 className="text-lg font-semibold">
          Documents <span className="font-normal text-slate-400">· gestion documentaire et versions</span>
        </h1>
      </div>

      <DocumentsView data={data} />
    </div>
  );
}
