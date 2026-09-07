'use client';

import { useState, useTransition } from 'react';
import { updateCompany } from '@/lib/company/actions';
import type { Company } from '@prisma/client';

export function CompanyForm({ company }: { company: Company }) {
  const [name, setName] = useState(company.name);
  const [homePort, setHomePort] = useState(company.homePort ?? '');
  const [address, setAddress] = useState(company.address ?? '');
  const [workDays, setWorkDays] = useState(company.serviceCycleWorkDays);
  const [restDays, setRestDays] = useState(company.serviceCycleRestDays);
  const [reliefTime, setReliefTime] = useState(company.reliefTimeOfDay);
  const [fuelAlert, setFuelAlert] = useState(company.fuelAlertThresholdPct);
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
      });
      setMessage('Modifications enregistrées.');
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nom de la compagnie</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Port d&apos;attache</label>
        <input
          value={homePort}
          onChange={(e) => setHomePort(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Adresse</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="border-t border-slate-200 pt-4">
        <p className="mb-2 text-sm font-medium text-slate-700">
          Cycle de service &amp; relève — valable pour toute la flotte
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Jours travail</label>
            <input
              type="number"
              min={1}
              value={workDays}
              onChange={(e) => setWorkDays(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Jours repos</label>
            <input
              type="number"
              min={1}
              value={restDays}
              onChange={(e) => setRestDays(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Heure de relève</label>
            <input
              type="time"
              value={reliefTime}
              onChange={(e) => setReliefTime(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Seuil d&apos;alerte carburant (%)
        </label>
        <input
          type="number"
          min={1}
          max={99}
          value={fuelAlert}
          onChange={(e) => setFuelAlert(Number(e.target.value))}
          className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {message && <p className="text-sm text-emerald-700">{message}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}
