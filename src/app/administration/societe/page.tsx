import { getCompany } from '@/lib/company/actions';
import { CompanyForm } from './company-form';

export const dynamic = 'force-dynamic';

export default async function SocietePage() {
  const company = await getCompany();

  return (
    <div>
      <div className="border-b border-slate-200 px-6 py-4">
        <h1 className="text-lg font-semibold">Société &amp; Paramètres</h1>
      </div>
      <div className="max-w-md p-6">
        <CompanyForm company={company} />
      </div>
    </div>
  );
}
