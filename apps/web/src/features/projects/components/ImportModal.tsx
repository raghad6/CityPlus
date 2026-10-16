'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { Button, Modal } from '@/components/ui';
import { projectsApi } from '../api';
import { useImportProjects } from '../hooks';
import type { ImportResult } from '../types';

/** Upload an Excel file of projects; shows row-by-row problems. */
export function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const importer = useImportProjects({
    onSuccess: (r) => { setResult(r); toast.success(t('import.done', { n: r.created, u: r.updated, s: r.unchanged })); },
  });
  const run = () => file && importer.mutate(file);

  const close = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={t('import.title')}
      footer={
        <>
          <Button variant="secondary" onClick={close}>{t('common.close')}</Button>
          <Button onClick={run} disabled={!file} loading={importer.isPending}>{t('import.run')}</Button>
        </>
      }
    >
      <p className="text-sm text-ink-600">{t('import.body')}</p>
      <a href={projectsApi.templateUrl()} className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline">
        <Download className="h-4 w-4" /> {t('import.template')}
      </a>
      <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-ink-200 px-4 py-8 text-center hover:border-brand-400 hover:bg-brand-50/40">
        <FileSpreadsheet className="h-8 w-8 text-brand-600" />
        <span className="text-sm font-medium text-ink-700">{file ? file.name : t('import.choose')}</span>
        <input type="file" accept=".xlsx" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); }} />
      </label>
      {result && (
        <div className="mt-4 rounded-lg bg-brand-50 p-3 text-xs text-ink-700">
          <div className="mb-1 font-semibold">{t('import.matched', { sheet: result.sheet, row: result.headerRow })}</div>
          <ul className="space-y-0.5">
            {result.matched.map((m) => (
              <li key={m.field}>{m.column} ← {lang === 'en' ? m.labelEn : m.label}</li>
            ))}
          </ul>
          {result.ignored.length > 0 && (
            <div className="mt-2 text-ink-500">{t('import.ignored')}: {result.ignored.join('، ')}</div>
          )}
        </div>
      )}
      {result && result.errors.length > 0 && (
        <div className="mt-4 max-h-40 overflow-y-auto rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
          <div className="mb-1 font-semibold">{t('import.errors')}</div>
          {result.errors.map((e, i) => (
            <div key={i}>{t('import.row', { n: e.row })}: {e.message}</div>
          ))}
        </div>
      )}
    </Modal>
  );
}
