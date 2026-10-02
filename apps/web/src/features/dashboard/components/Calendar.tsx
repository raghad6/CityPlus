'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Flag, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui';
import { STATUS_STYLE } from '@/features/projects/components/StatusBadge';
import { useCalendar } from '../hooks';
import type { CalendarEvent as Event } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Month calendar of project start and due dates; click a day to list its projects. */
export function Calendar({ projectHref }: { projectHref: (id: string) => string }) {
  const { t, lang } = useI18n();
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string>(todayKey);
  const month = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}`;

  const { data: events = [] } = useCalendar(month);

  const byDay = useMemo(() => {
    const m = new Map<string, Event[]>();
    for (const e of events) m.set(e.date, [...(m.get(e.date) ?? []), e]);
    return m;
  }, [events]);

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const arr: (string | null)[] = Array(first.getDay()).fill(null);
    for (let d = 1; d <= days; d++) arr.push(`${month}-${pad(d)}`);
    while (arr.length % 7) arr.push(null);
    return arr;
  }, [cursor, month]);

  const title = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', { month: 'long', year: 'numeric' }).format(cursor);
  const move = (d: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + d, 1));
  const selectedEvents = byDay.get(selected) ?? [];

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-ink-900">{title}</h3>
        <div className="flex gap-1">
          <button onClick={() => move(-1)} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100" aria-label="previous month">
            <ChevronRight className="h-4 w-4 ltr:rotate-180" />
          </button>
          <button onClick={() => move(1)} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100" aria-label="next month">
            <ChevronLeft className="h-4 w-4 ltr:rotate-180" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-ink-400">
        {t('cal.days').split(',').map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((key, i) => {
          if (!key) return <div key={i} />;
          const ev = byDay.get(key) ?? [];
          const isToday = key === todayKey;
          const isSel = key === selected;
          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={cn(
                'relative flex h-10 flex-col items-center justify-center rounded-lg text-sm tabular-nums transition',
                isSel ? 'bg-brand-700 text-white' : isToday ? 'bg-accent-50 font-semibold text-accent-700' : 'text-ink-700 hover:bg-ink-100',
              )}
            >
              {Number(key.slice(-2))}
              {ev.length > 0 && (
                <span className="absolute bottom-1 flex gap-0.5">
                  {ev.slice(0, 3).map((e, j) => (
                    <span key={j} className={cn('h-1 w-1 rounded-full', isSel ? 'bg-white' : e.type === 'due' ? 'bg-accent-500' : 'bg-brand-500')} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-4 space-y-2 border-t border-ink-100 pt-3">
        {selectedEvents.length === 0 ? (
          <p className="py-1 text-center text-xs text-ink-400">{t('cal.noEvents')}</p>
        ) : (
          selectedEvents.map((e) => (
            <Link key={e.projectId + e.type} href={projectHref(e.projectId)} className="flex items-start gap-2 rounded-lg p-1.5 text-sm hover:bg-ink-50">
              {e.type === 'due' ? <Flag className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" /> : <PlayCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />}
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-ink-800">{e.title}</span>
                <span className="text-xs" style={{ color: STATUS_STYLE[e.status].color }}>
                  {t(e.type === 'due' ? 'cal.due' : 'cal.start')} · {t(`status.${e.status}`)}
                </span>
              </span>
            </Link>
          ))
        )}
      </div>
    </Card>
  );
}
