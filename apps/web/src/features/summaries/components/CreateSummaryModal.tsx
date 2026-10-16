'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { Button, Field, Input, Modal, Segmented } from '@/components/ui';
import { useCreateSummary } from '../hooks';

type Preset = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom';

/** YYYY-MM-DD in the browser's time zone. */
const ymd = (d: Date) => d.toLocaleDateString('en-CA');
const shift = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

/** Weeks start on Sunday, as in the automatic weekly report. */
function range(p: Exclude<Preset, 'custom'>): [string, string] {
  const today = new Date();
  const sunday = shift(today, -today.getDay());
  switch (p) {
    case 'thisWeek': return [ymd(sunday), ymd(today)];
    case 'lastWeek': return [ymd(shift(sunday, -7)), ymd(shift(sunday, -1))];
    case 'thisMonth': return [ymd(new Date(today.getFullYear(), today.getMonth(), 1)), ymd(today)];
    case 'lastMonth': return [ymd(new Date(today.getFullYear(), today.getMonth() - 1, 1)), ymd(new Date(today.getFullYear(), today.getMonth(), 0))];
  }
}

/** Create a performance report for any period; opens it when ready. */
export function CreateSummaryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const [preset, setPreset] = useState<Preset>('thisMonth');
  const [custom, setCustom] = useState<[string, string]>(range('thisMonth'));
  const [from, to] = preset === 'custom' ? custom : range(preset);
  const create = useCreateSummary({
    success: t('summaries.created'),
    onSuccess: (r) => { onClose(); router.push(`/admin/summaries/${r.id}`); },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t('summaries.new')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button loading={create.isPending} disabled={!from || !to} onClick={() => create.mutate({ from, to, kind: 'CUSTOM' })}>{t('summaries.new')}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <Segmented<Preset>
            value={preset}
            onChange={setPreset}
            options={(['thisWeek', 'lastWeek', 'thisMonth', 'lastMonth', 'custom'] as const).map((p) => ({ value: p, label: t(`summaries.preset.${p}`) }))}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('summaries.from')}>
            <Input type="date" value={from} disabled={preset !== 'custom'} onChange={(e) => setCustom([e.target.value, custom[1]])} />
          </Field>
          <Field label={t('summaries.to')}>
            <Input type="date" value={to} disabled={preset !== 'custom'} onChange={(e) => setCustom([custom[0], e.target.value])} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
