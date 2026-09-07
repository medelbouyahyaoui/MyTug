'use client';

import { useState, useTransition } from 'react';
import { generateReport, type ReportResult } from '@/lib/reports/actions';
import { REPORT_LABEL, type ReportType } from '@/lib/reports/constants';

type Tug = { id: string; name: string };

function toCsv(result: ReportResult): string {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [result.columns.map(escape).join(';'), ...result.rows.map((row) => row.map(escape).join(';'))];
  return '﻿' + lines.join('\r\n');
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ReportsView({ reports, tugs }: { reports: { type: ReportType; label: string }[]; tugs: Tug[] }) {
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<ReportType>(reports[0]?.type);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [tugId, setTugId] = useState('');
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function generate() {
    setError(null);
    startTransition(async () => {
      try {
        const r = await generateReport(type, { from: from || undefined, to: to || undefined, tugId: tugId || undefined });
        setResult(r);
      } catch {
        setError('Erreur lors de la génération du rapport.');
      }
    });
  }

  function exportCsv() {
    if (!result) return;
    downloadCsv(`${REPORT_LABEL[type].toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`, toCsv(result));
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 print:hidden">
          <div>
            <label className="block text-xs font-medium text-slate-500">Rapport</label>
            <select value={type} onChange={(e) => setType(e.target.value as ReportType)} className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm">
              {reports.map((r) => (
                <option key={r.type} value={r.type}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Du</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Au</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Remorqueur</label>
            <select value={tugId} onChange={(e) => setTugId(e.target.value)} className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm">
              <option value="">Tous</option>
              {tugs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <button onClick={generate} disabled={isPending} className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
            Générer
          </button>
          {result && (
            <>
              <button onClick={exportCsv} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Exporter CSV
              </button>
              <button onClick={() => window.print()} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Imprimer / PDF
              </button>
            </>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {result && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 print:border-0 print:p-0">
            <h2 className="mb-3 text-sm font-semibold print:block">{REPORT_LABEL[type]}</h2>
            {result.rows.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune donnée pour cette période.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                      {result.columns.map((c) => (
                        <th key={c} className="py-1.5 pr-4">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        {row.map((cell, j) => (
                          <td key={j} className="py-1.5 pr-4">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
