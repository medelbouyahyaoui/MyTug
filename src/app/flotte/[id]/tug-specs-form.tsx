'use client';

import { useState, useTransition } from 'react';
import { updateTugSpecs } from '@/lib/tugs/actions';

type TugSpecs = {
  id: string;
  imo: string | null;
  callSign: string | null;
  flag: string | null;
  yearBuilt: number | null;
  shipyard: string | null;
  lengthM: number | null;
  widthM: number | null;
  draftM: number | null;
  tonnageGT: number | null;
  bollardPullT: number | null;
  speedKnots: number | null;
  propulsionType: string | null;
  fuelCapacityT: number | null;
  oilCapacityL: number | null;
  fireFightingEquipment: string | null;
  towingEquipment: string | null;
  winch: string | null;
};

function Field({
  label,
  value,
  onChange,
  readOnly,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  readOnly: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        className={`w-full rounded-lg border px-3 py-1.5 text-sm ${
          readOnly ? 'border-slate-100 bg-slate-50 text-slate-500' : 'border-slate-300'
        }`}
      />
    </div>
  );
}

export function TugSpecsForm({ tug, readOnly }: { tug: TugSpecs; readOnly: boolean }) {
  const [values, setValues] = useState({
    imo: tug.imo ?? '',
    callSign: tug.callSign ?? '',
    flag: tug.flag ?? '',
    yearBuilt: tug.yearBuilt?.toString() ?? '',
    shipyard: tug.shipyard ?? '',
    lengthM: tug.lengthM?.toString() ?? '',
    widthM: tug.widthM?.toString() ?? '',
    draftM: tug.draftM?.toString() ?? '',
    tonnageGT: tug.tonnageGT?.toString() ?? '',
    bollardPullT: tug.bollardPullT?.toString() ?? '',
    speedKnots: tug.speedKnots?.toString() ?? '',
    propulsionType: tug.propulsionType ?? '',
    fuelCapacityT: tug.fuelCapacityT?.toString() ?? '',
    oilCapacityL: tug.oilCapacityL?.toString() ?? '',
    fireFightingEquipment: tug.fireFightingEquipment ?? '',
    towingEquipment: tug.towingEquipment ?? '',
    winch: tug.winch ?? '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set(key: keyof typeof values) {
    return (v: string) => setValues((s) => ({ ...s, [key]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const num = (v: string) => (v.trim() === '' ? undefined : Number(v));
      await updateTugSpecs(tug.id, {
        imo: values.imo || undefined,
        callSign: values.callSign || undefined,
        flag: values.flag || undefined,
        yearBuilt: num(values.yearBuilt),
        shipyard: values.shipyard || undefined,
        lengthM: num(values.lengthM),
        widthM: num(values.widthM),
        draftM: num(values.draftM),
        tonnageGT: num(values.tonnageGT),
        bollardPullT: num(values.bollardPullT),
        speedKnots: num(values.speedKnots),
        propulsionType: values.propulsionType || undefined,
        fuelCapacityT: num(values.fuelCapacityT),
        oilCapacityL: num(values.oilCapacityL),
        fireFightingEquipment: values.fireFightingEquipment || undefined,
        towingEquipment: values.towingEquipment || undefined,
        winch: values.winch || undefined,
      });
      setMessage('Modifications enregistrées.');
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold">Identification</h2>
      <div className="grid grid-cols-2 gap-3">
        <Field label="IMO" value={values.imo} onChange={set('imo')} readOnly={readOnly} />
        <Field label="Indicatif" value={values.callSign} onChange={set('callSign')} readOnly={readOnly} />
        <Field label="Pavillon" value={values.flag} onChange={set('flag')} readOnly={readOnly} />
        <Field
          label="Année de construction"
          value={values.yearBuilt}
          onChange={set('yearBuilt')}
          readOnly={readOnly}
          type="number"
        />
        <Field label="Chantier" value={values.shipyard} onChange={set('shipyard')} readOnly={readOnly} />
      </div>

      <h2 className="mb-3 mt-5 text-sm font-semibold">Dimensions &amp; capacités</h2>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Longueur (m)" value={values.lengthM} onChange={set('lengthM')} readOnly={readOnly} type="number" />
        <Field label="Largeur (m)" value={values.widthM} onChange={set('widthM')} readOnly={readOnly} type="number" />
        <Field label="Tirant d'eau (m)" value={values.draftM} onChange={set('draftM')} readOnly={readOnly} type="number" />
        <Field label="Tonnage (GT)" value={values.tonnageGT} onChange={set('tonnageGT')} readOnly={readOnly} type="number" />
        <Field label="Bollard pull (t)" value={values.bollardPullT} onChange={set('bollardPullT')} readOnly={readOnly} type="number" />
        <Field label="Vitesse (nœuds)" value={values.speedKnots} onChange={set('speedKnots')} readOnly={readOnly} type="number" />
      </div>

      <h2 className="mb-3 mt-5 text-sm font-semibold">Propulsion &amp; fluides</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Field
            label="Propulsion (résumé)"
            value={values.propulsionType}
            onChange={set('propulsionType')}
            readOnly={readOnly}
          />
        </div>
        <Field
          label="Capacité carburant (t)"
          value={values.fuelCapacityT}
          onChange={set('fuelCapacityT')}
          readOnly={readOnly}
          type="number"
        />
        <Field
          label="Capacité huile (L)"
          value={values.oilCapacityL}
          onChange={set('oilCapacityL')}
          readOnly={readOnly}
          type="number"
        />
      </div>

      <h2 className="mb-3 mt-5 text-sm font-semibold">Équipements</h2>
      <div className="grid grid-cols-1 gap-3">
        <Field
          label="Équipements incendie"
          value={values.fireFightingEquipment}
          onChange={set('fireFightingEquipment')}
          readOnly={readOnly}
        />
        <Field
          label="Caractéristiques de remorquage"
          value={values.towingEquipment}
          onChange={set('towingEquipment')}
          readOnly={readOnly}
        />
        <Field label="Treuil" value={values.winch} onChange={set('winch')} readOnly={readOnly} />
      </div>

      {!readOnly && (
        <>
          {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {isPending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </>
      )}
    </form>
  );
}
