'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createDocument,
  createDocumentType,
  addDocumentVersion,
  toggleDocumentStatus,
  type ActionResult,
  type CreateTypeResult,
  type getDocumentsOverview,
} from '@/lib/documents/actions';

type Data = Awaited<ReturnType<typeof getDocumentsOverview>>;

type LinkKind = 'NONE' | 'TUG' | 'MAINTENANCE' | 'CERTIFICATE' | 'EXERCISE' | 'SAFETY';

const LINK_LABEL: Record<LinkKind, string> = {
  NONE: 'Aucun (document général)',
  TUG: 'Remorqueur',
  MAINTENANCE: 'Intervention de maintenance',
  CERTIFICATE: 'Certificat',
  EXERCISE: "Exécution d'exercice",
  SAFETY: 'Observation de sécurité',
};

const STATUS_LABEL: Record<string, string> = { ACTIF: 'Actif', ARCHIVE: 'Archivé' };

function fmtDateTime(dt: Date | string) {
  return new Date(dt).toLocaleString('fr-FR');
}
function fmtDate(dt: Date | string | null) {
  return dt ? new Date(dt).toLocaleDateString('fr-FR') : '—';
}

function linkKindsForRole(role: string): LinkKind[] {
  if (role === 'ADMINISTRATEUR' || role === 'CHEF_ARMEMENT') return ['NONE', 'TUG', 'MAINTENANCE', 'CERTIFICATE', 'EXERCISE', 'SAFETY'];
  if (role === 'CHEF_MECANICIEN') return ['TUG', 'MAINTENANCE'];
  if (role === 'CAPITAINE') return ['EXERCISE', 'SAFETY'];
  return [];
}

function documentLinkLabel(doc: Data['documents'][number]) {
  if (doc.maintenanceIntervention) return `${doc.maintenanceIntervention.tug.name} — intervention du ${fmtDate(doc.maintenanceIntervention.occurredAt)}`;
  if (doc.certificate) return `${doc.certificate.tug.name} — ${doc.certificate.type.name}`;
  if (doc.exerciseExecution) return `${doc.exerciseExecution.programEntry.tug.name} — ${doc.exerciseExecution.programEntry.type.name}`;
  if (doc.safetyObservation) return `${doc.safetyObservation.tug.name} — observation sécurité`;
  if (doc.tug) return doc.tug.name;
  return 'Général';
}

export function DocumentsView({ data }: { data: Data }) {
  const { documents, documentTypes, tugs, interventions, certificates, executions, observations, role, canCreate, canManageGeneral } = data;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  const availableLinkKinds = useMemo(() => linkKindsForRole(role), [role]);

  const [linkKind, setLinkKind] = useState<LinkKind>(availableLinkKinds[0] ?? 'NONE');
  const [linkedId, setLinkedId] = useState('');
  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState(documentTypes[0]?.id ?? '');
  const [expiresAt, setExpiresAt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [newTypeName, setNewTypeName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ACTIF' | 'ARCHIVE' | 'TOUS'>('ACTIF');

  const linkOptions = useMemo(() => {
    switch (linkKind) {
      case 'TUG':
        return tugs.map((t) => ({ id: t.id, label: t.name }));
      case 'MAINTENANCE':
        return interventions.map((i) => ({ id: i.id, label: `${i.tug.name} — ${fmtDate(i.occurredAt)}${i.description ? ` — ${i.description.slice(0, 40)}` : ''}` }));
      case 'CERTIFICATE':
        return certificates.map((c) => ({ id: c.id, label: `${c.tug.name} — ${c.type.name}` }));
      case 'EXERCISE':
        return executions.map((e) => ({ id: e.id, label: `${e.programEntry.tug.name} — ${e.programEntry.type.name} (${fmtDate(e.actualDate)})` }));
      case 'SAFETY':
        return observations.map((o) => ({ id: o.id, label: `${o.tug.name} — ${o.description.slice(0, 40)}` }));
      default:
        return [];
    }
  }, [linkKind, tugs, interventions, certificates, executions, observations]);

  function addType() {
    if (!newTypeName.trim()) return;
    startTransition(async () => {
      const result: CreateTypeResult = await createDocumentType(newTypeName);
      if (result.ok) {
        setNewTypeName('');
        setTypeId(result.id);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function submit() {
    setError(null);
    if (!name.trim()) return setError('Nom requis.');
    if (!typeId) return setError('Type requis.');
    if (!file) return setError('Fichier requis.');
    if (linkKind !== 'NONE' && !linkedId) return setError('Sélectionnez un élément lié.');

    const formData = new FormData();
    formData.set('name', name);
    formData.set('typeId', typeId);
    if (expiresAt) formData.set('expiresAt', expiresAt);
    formData.set('file', file);
    if (linkKind === 'TUG') formData.set('tugId', linkedId);
    if (linkKind === 'MAINTENANCE') formData.set('maintenanceInterventionId', linkedId);
    if (linkKind === 'CERTIFICATE') formData.set('certificateId', linkedId);
    if (linkKind === 'EXERCISE') formData.set('exerciseExecutionId', linkedId);
    if (linkKind === 'SAFETY') formData.set('safetyObservationId', linkedId);

    startTransition(async () => {
      const result: ActionResult = await createDocument(formData);
      if (result.ok) {
        setName('');
        setExpiresAt('');
        setFile(null);
        setLinkedId('');
        setShowForm(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const visibleDocuments = documents.filter((d) => filter === 'TOUS' || d.status === filter);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {(['ACTIF', 'ARCHIVE', 'TOUS'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${filter === f ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                {f === 'TOUS' ? 'Tous' : STATUS_LABEL[f]}
              </button>
            ))}
          </div>
          {canCreate && !showForm && (
            <button onClick={() => setShowForm(true)} className="text-xs font-medium text-sky-600 hover:text-sky-700">
              + Nouveau document
            </button>
          )}
        </div>

        {showForm && (
          <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <div>
              <label className="block text-xs font-medium text-slate-500">Lien</label>
              <div className="mt-1 flex gap-2">
                <select
                  value={linkKind}
                  onChange={(e) => {
                    setLinkKind(e.target.value as LinkKind);
                    setLinkedId('');
                  }}
                  className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                >
                  {availableLinkKinds.map((k) => (
                    <option key={k} value={k}>
                      {LINK_LABEL[k]}
                    </option>
                  ))}
                </select>
                {linkKind !== 'NONE' && (
                  <select value={linkedId} onChange={(e) => setLinkedId(e.target.value)} className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                    <option value="">— Sélectionner —</option>
                    {linkOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500">Nom</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500">Type</label>
              <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                {documentTypes.length === 0 && <option value="">Aucun type configuré</option>}
                {documentTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {canManageGeneral && (
                <div className="mt-1.5 flex gap-2">
                  <input
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="+ Ajouter un type au référentiel"
                    className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs"
                  />
                  <button onClick={addType} className="text-xs font-medium text-sky-600 hover:text-sky-700">
                    Ajouter
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500">Expiration (facultatif)</label>
              <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500">Fichier</label>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1 w-full text-sm" />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button onClick={submit} disabled={isPending} className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50">
                Envoyer
              </button>
              <button onClick={() => setShowForm(false)} className="text-xs text-slate-400 hover:text-slate-600">
                Annuler
              </button>
            </div>
          </div>
        )}

        {visibleDocuments.length === 0 && !showForm && <p className="mt-3 text-sm text-slate-400">Aucun document.</p>}

        <ul className="mt-4 space-y-3">
          {visibleDocuments.map((doc) => (
            <DocumentItem key={doc.id} doc={doc} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function DocumentItem({ doc }: { doc: Data['documents'][number] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showVersionForm, setShowVersionForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const latest = doc.versions[0];

  function submitVersion() {
    setError(null);
    if (!file) return setError('Fichier requis.');
    const formData = new FormData();
    formData.set('file', file);
    startTransition(async () => {
      const result: ActionResult = await addDocumentVersion(doc.id, formData);
      if (result.ok) {
        setFile(null);
        setShowVersionForm(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function toggleStatus() {
    startTransition(async () => {
      const result: ActionResult = await toggleDocumentStatus(doc.id);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium">{doc.name}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{doc.type.name}</span>
        {doc.status === 'ARCHIVE' && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">Archivé</span>}
        {doc.isExpired && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Expiré</span>}
        <span className="ml-auto text-xs text-slate-400">{documentLinkLabel(doc)}</span>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Par {doc.author.firstName} {doc.author.lastName} — {fmtDateTime(doc.createdAt)}
        {doc.expiresAt && ` — Expire le ${fmtDate(doc.expiresAt)}`}
      </p>

      <ul className="mt-2 space-y-0.5">
        {doc.versions.map((v) => (
          <li key={v.id} className="text-xs">
            <a href={v.fileUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-sky-600 hover:text-sky-700">
              Version {v.versionNumber}
            </a>
            <span className="text-slate-400"> — {fmtDateTime(v.createdAt)}</span>
          </li>
        ))}
      </ul>
      {!latest && <p className="mt-1 text-xs text-slate-400">Aucune version.</p>}

      <div className="mt-2 flex items-center gap-3">
        {!showVersionForm ? (
          <button onClick={() => setShowVersionForm(true)} className="text-xs font-medium text-sky-600 hover:text-sky-700">
            + Nouvelle version
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-xs" />
            <button onClick={submitVersion} disabled={isPending} className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50">
              Envoyer
            </button>
            <button onClick={() => setShowVersionForm(false)} className="text-xs text-slate-400 hover:text-slate-600">
              Annuler
            </button>
          </div>
        )}
        <button onClick={toggleStatus} disabled={isPending} className="text-xs font-medium text-slate-500 hover:text-slate-700">
          {doc.status === 'ACTIF' ? 'Archiver' : 'Réactiver'}
        </button>
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </li>
  );
}
