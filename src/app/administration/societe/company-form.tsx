'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateCompany, createPoste, togglePosteArchived, type CreateResult, type ActionResult } from '@/lib/company/actions';
import { createDocumentType, toggleDocumentTypeArchived } from '@/lib/documents/actions';
import type { Company, Poste, DocumentType } from '@prisma/client';

export function CompanyForm({ company, postes, documentTypes }: { company: Company; postes: Poste[]; documentTypes: DocumentType[] }) {
  const [name, setName] = useState(company.name);
  const [homePort, setHomePort] = useState(company.homePort ?? '');
  const [address, setAddress] = useState(company.address ?? '');
  const [workDays, setWorkDays] = useState(company.serviceCycleWorkDays);
  const [restDays, setRestDays] = useState(company.serviceCycleRestDays);
  const [reliefTime, setReliefTime] = useState(company.reliefTimeOfDay);
  const [fuelAlert, setFuelAlert] = useState(company.fuelAlertThresholdPct);
  const [maintHoursAlert1, setMaintHoursAlert1] = useState(company.maintenanceHoursAlert1);
  const [maintHoursAlert2, setMaintHoursAlert2] = useState(company.maintenanceHoursAlert2);
  const [maintDaysAlert1, setMaintDaysAlert1] = useState(company.maintenanceDaysAlert1);
  const [maintDaysAlert2, setMaintDaysAlert2] = useState(company.maintenanceDaysAlert2);
  const [maintDaysAlert3, setMaintDaysAlert3] = useState(company.maintenanceDaysAlert3);
  const [certAlert1, setCertAlert1] = useState(company.certificateDaysAlert1);
  const [certAlert2, setCertAlert2] = useState(company.certificateDaysAlert2);
  const [certAlert3, setCertAlert3] = useState(company.certificateDaysAlert3);
  const [emailEnabled, setEmailEnabled] = useState(company.emailNotificationsEnabled);
  const [pushEnabled, setPushEnabled] = useState(company.pushNotificationsEnabled);
  const [smsEnabled, setSmsEnabled] = useState(company.smsNotificationsEnabled);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      await updateCompany({
        name,
        homePort,
        address,
        serviceCycleWorkDays: Number(workDays),
        serviceCycleRestDays: Number(restDays),
        reliefTimeOfDay: reliefTime,
        fuelAlertThresholdPct: Number(fuelAlert),
        maintenanceHoursAlert1: Number(maintHoursAlert1),
        maintenanceHoursAlert2: Number(maintHoursAlert2),
        maintenanceDaysAlert1: Number(maintDaysAlert1),
        maintenanceDaysAlert2: Number(maintDaysAlert2),
        maintenanceDaysAlert3: Number(maintDaysAlert3),
        certificateDaysAlert1: Number(certAlert1),
        certificateDaysAlert2: Number(certAlert2),
        certificateDaysAlert3: Number(certAlert3),
        emailNotificationsEnabled: emailEnabled,
        pushNotificationsEnabled: pushEnabled,
        smsNotificationsEnabled: smsEnabled,
      });
      setMessage('Modifications enregistrées.');
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nom de la compagnie</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Port d&apos;attache</label>
          <input value={homePort} onChange={(e) => setHomePort(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Adresse</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>

        <div className="border-t border-slate-200 pt-4">
          <p className="mb-2 text-sm font-medium text-slate-700">Cycle de service &amp; relève — valable pour toute la flotte</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Jours travail</label>
              <input type="number" min={1} value={workDays} onChange={(e) => setWorkDays(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Jours repos</label>
              <input type="number" min={1} value={restDays} onChange={(e) => setRestDays(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Heure de relève</label>
              <input type="time" value={reliefTime} onChange={(e) => setReliefTime(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <p className="mb-2 text-sm font-medium text-slate-700">Seuils d&apos;alerte</p>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Carburant (%)</label>
            <input type="number" min={1} max={99} value={fuelAlert} onChange={(e) => setFuelAlert(Number(e.target.value))} className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Maintenance — 1er palier (h avant)</label>
              <input type="number" min={0} value={maintHoursAlert1} onChange={(e) => setMaintHoursAlert1(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Maintenance — 2e palier (h avant)</label>
              <input type="number" min={0} value={maintHoursAlert2} onChange={(e) => setMaintHoursAlert2(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Maintenance — J-1 (j avant)</label>
              <input type="number" min={0} value={maintDaysAlert1} onChange={(e) => setMaintDaysAlert1(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Maintenance — J-2</label>
              <input type="number" min={0} value={maintDaysAlert2} onChange={(e) => setMaintDaysAlert2(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Maintenance — J-3</label>
              <input type="number" min={0} value={maintDaysAlert3} onChange={(e) => setMaintDaysAlert3(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Certificats — J-1 (j avant)</label>
              <input type="number" min={0} value={certAlert1} onChange={(e) => setCertAlert1(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Certificats — J-2</label>
              <input type="number" min={0} value={certAlert2} onChange={(e) => setCertAlert2(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Certificats — J-3</label>
              <input type="number" min={0} value={certAlert3} onChange={(e) => setCertAlert3(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <p className="mb-2 text-sm font-medium text-slate-700">Canaux de notification</p>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} />
              E-mail
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={pushEnabled} onChange={(e) => setPushEnabled(e.target.checked)} />
              Push (navigateur/mobile)
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={smsEnabled} onChange={(e) => setSmsEnabled(e.target.checked)} />
              SMS
            </label>
          </div>
          <p className="mt-1 text-xs text-slate-400">Le centre de notifications in-app reste toujours actif, indépendamment de ces canaux.</p>
        </div>

        {message && <p className="text-sm text-emerald-700">{message}</p>}

        <button type="submit" disabled={isPending} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
          {isPending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>

      <ItemListManager title="Postes d'équipage" items={postes} onCreate={createPoste} onToggleArchived={togglePosteArchived} />
      <ItemListManager title="Types de documents" items={documentTypes} onCreate={createDocumentType} onToggleArchived={toggleDocumentTypeArchived} />
    </div>
  );
}

function ItemListManager({
  title,
  items,
  onCreate,
  onToggleArchived,
}: {
  title: string;
  items: { id: string; name: string; isArchived: boolean }[];
  onCreate: (name: string) => Promise<CreateResult>;
  onToggleArchived: (id: string, isArchived: boolean) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  function add() {
    setError(null);
    if (!newName.trim()) return;
    startTransition(async () => {
      const result = await onCreate(newName);
      if (result.ok) {
        setNewName('');
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function toggle(id: string, isArchived: boolean) {
    startTransition(async () => {
      await onToggleArchived(id, !isArchived);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="mb-3 text-sm font-semibold">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-sm">
            <span className={item.isArchived ? 'text-slate-400 line-through' : 'text-slate-700'}>{item.name}</span>
            <button onClick={() => toggle(item.id, item.isArchived)} disabled={isPending} className="ml-auto text-xs font-medium text-sky-600 hover:text-sky-700 disabled:opacity-50">
              {item.isArchived ? 'Réactiver' : 'Archiver'}
            </button>
          </li>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400">Aucun élément.</p>}
      </ul>
      <div className="mt-3 flex gap-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nouveau nom" className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
        <button onClick={add} disabled={isPending} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          Ajouter
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
