'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CalendarCheck, CalendarClock, CheckCircle2, FileBarChart } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useI18n } from '@/lib/i18n';
import { date } from '@/lib/format';
import { Spinner } from '@/components/ui';
import { useNotifications, useReadAllNotifications, useReadNotification, useUnreadCount } from '../hooks';
import type { AppNotification, NotificationType } from '../types';

const ICONS: Record<NotificationType, React.ElementType> = {
  PROJECT_STARTED: CalendarClock,
  PROJECT_DUE: CalendarCheck,
  PROJECT_COMPLETED: CheckCircle2,
  SUMMARY_READY: FileBarChart,
};

/** Header bell: unread count, and a panel with the latest notifications. */
export function NotificationBell() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: count } = useUnreadCount();
  const { data: items, isLoading } = useNotifications(open);
  const read = useReadNotification();
  const readAll = useReadAllNotifications();
  const unread = count?.count ?? 0;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const openItem = (n: AppNotification) => {
    if (!n.readAt) read.mutate(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative rounded-lg p-2 text-ink-600 hover:bg-ink-100" aria-label={t('notif.title')}>
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 end-0.5 min-w-[18px] rounded-full bg-accent-500 px-1 text-center text-[10px] font-semibold leading-[18px] text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute end-0 top-11 z-40 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-ink-100 bg-white shadow-pop">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <span className="font-semibold text-ink-900">{t('notif.title')}</span>
            {unread > 0 && (
              <button onClick={() => readAll.mutate(undefined)} className="text-xs font-medium text-brand-700 hover:underline">{t('notif.readAll')}</button>
            )}
          </div>
          <div className="max-h-[26rem] overflow-y-auto scrollbar-thin">
            {isLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : !items?.length ? (
              <div className="px-4 py-10 text-center text-sm text-ink-400">{t('notif.empty')}</div>
            ) : (
              <ul className="divide-y divide-ink-100">
                {items.map((n) => {
                  const Icon = ICONS[n.type] ?? Bell;
                  return (
                    <li key={n.id}>
                      <button onClick={() => openItem(n)} className={cn('flex w-full gap-3 px-4 py-3 text-start hover:bg-ink-50', !n.readAt && 'bg-brand-50/50')}>
                        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', n.readAt ? 'text-ink-400' : 'text-brand-600')} />
                        <span className="min-w-0 flex-1">
                          <span className={cn('block text-sm', n.readAt ? 'text-ink-700' : 'font-medium text-ink-900')}>{lang === 'en' ? n.titleEn : n.title}</span>
                          {(lang === 'en' ? n.bodyEn : n.body) && <span className="mt-0.5 block text-xs text-ink-500">{lang === 'en' ? n.bodyEn : n.body}</span>}
                          <span className="mt-1 block text-[11px] text-ink-400">{date(lang, n.createdAt, true)}</span>
                        </span>
                        {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-500" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
