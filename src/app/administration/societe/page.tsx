import { getCompany, getAllPostes } from '@/lib/company/actions';
import { getAllDocumentTypes } from '@/lib/documents/actions';
import { CompanyForm } from './company-form';

export const dynamic = 'force-dynamic';

export default async function SocietePage() {
  const [company, postes, documentTypes] = await Promise.all([getCompany(), getAllPostes(), getAllDocumentTypes()]);

  return (
    <div>
      <div className="border-b border-slate-200 px-6 py-4">
        <h1 className="text-lg font-semibold">Société &amp; Paramètres</h1>
      </div>
      <div className="max-w-xl p-6">
        <CompanyForm company={company} postes={postes} documentTypes={documentTypes} />
      </div>
    </div>
  );
}
