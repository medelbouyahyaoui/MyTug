import { getReferentiels } from '@/lib/referentiels/actions';
import { ReferentielsView } from './referentiels-view';

export const dynamic = 'force-dynamic';

export default async function ReferentielsPage() {
  const referentiels = await getReferentiels();

  return (
    <div>
      <div className="border-b border-slate-200 px-6 py-4">
        <h1 className="text-lg font-semibold">
          Référentiels <span className="font-normal text-slate-400">· listes opérationnelles partagées par la flotte</span>
        </h1>
      </div>
      <div className="p-6">
        <ReferentielsView referentiels={referentiels} />
      </div>
    </div>
  );
}
