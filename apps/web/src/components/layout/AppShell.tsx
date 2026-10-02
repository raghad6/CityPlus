'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Globe, LogOut, Menu, UserRound, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useI18n } from '@/lib/i18n';
import { useLogout, useMe } from '@/features/auth/hooks';
import type { DictKey } from '@/lib/dict';
import { Avatar, Spinner } from '@/components/ui';

export interface NavItem {
  href: string;
  label: DictKey;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  exact?: boolean;
}

export function Logo({ light, subtitle }: { light?: boolean; subtitle?: string }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" className="h-9 w-9 shrink-0" aria-hidden>
        <rect width="64" height="64" rx="16" fill={light ? '#ffffff1a' : '#156253'} />
        {/* City skyline with a plus: City+ */}
        <path d="M11 31.5 16 25l5 6.5V50H11z" fill="#fff" />
        <rect x="24" y="18" width="12" height="32" rx="1.5" fill="#fff" />
        <rect x="39" y="36" width="12" height="14" rx="1.5" fill="#fff" />
        <g fill={light ? '#29524b' : '#156253'}>
          <rect x="14.5" y="35" width="3" height="3" />
          <rect x="14.5" y="41" width="3" height="3" />
          <rect x="27" y="22" width="2.5" height="3" />
          <rect x="30.5" y="22" width="2.5" height="3" />
          <rect x="27" y="28" width="2.5" height="3" />
          <rect x="30.5" y="28" width="2.5" height="3" />
          <rect x="27" y="34" width="2.5" height="3" />
          <rect x="30.5" y="34" width="2.5" height="3" />
          <rect x="28" y="43" width="4" height="7" />
          <rect x="42" y="40" width="2.5" height="3" />
          <rect x="45.5" y="40" width="2.5" height="3" />
        </g>
        <rect x="43" y="13" width="4" height="16" rx="2" fill="#e9b1ab" />
        <rect x="37" y="19" width="16" height="4" rx="2" fill="#e9b1ab" />
      </svg>
      <div className="min-w-0 leading-tight">
        <div className={cn('text-lg font-bold', light ? 'text-white' : 'text-ink-900')}>
          {/* dir=ltr keeps the + after the name in the Arabic (RTL) UI */}
          <span dir="ltr">{t('app.name')}</span>
        </div>
        {subtitle && <div className={cn('truncate text-xs', light ? 'text-brand-100' : 'text-ink-500')}>{subtitle}</div>}
      </div>
    </div>
  );
}

export function LangToggle({ className }: { className?: string }) {
  const { t, lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
      className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-ink-600 hover:bg-ink-100', className)}
    >
      <Globe className="h-4 w-4" />
      {t('common.language')}
    </button>
  );
}

export function AppShell({ nav, children, profileHref }: { nav: NavItem[]; children: React.ReactNode; profileHref: string }) {
  const pathname = usePathname();
  const { t, n } = useI18n();
  const { data: me, isLoading } = useMe();
  const logout = useLogout();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/');

  const sidebar = (
    <div className="flex h-full flex-col bg-brand-900 text-brand-50">
      <div className="px-5 py-5">
        <Logo light subtitle={me?.tenant ? n(me.tenant) : me?.role === 'SUPER_ADMIN' ? t('nav.platform') : undefined} />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2 scrollbar-thin">
        {nav.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                active ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-100 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-brand-700' : 'text-brand-300 group-hover:text-white')} />
              <span className="flex-1">{t(item.label)}</span>
              {!!item.badge && (
                <span className="rounded-full bg-accent-500 px-2 py-0.5 text-[11px] font-semibold leading-none text-white">{item.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        {me && (
          <Link href={profileHref} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/10">
            <Avatar name={me.name} className="bg-white/15 text-white" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">{me.name}</div>
              <div className="truncate text-xs text-brand-200">
                {t(`role.${me.role}`)}{me.department ? ` · ${n(me.department)}` : ''}
              </div>
            </div>
          </Link>
        )}
        <button
          onClick={logout}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-brand-200 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4 rtl:rotate-180" />
          {t('common.logout')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-72 max-w-[85%]">
            {sidebar}
            <button onClick={() => setOpen(false)} className="absolute end-3 top-5 rounded-lg p-1 text-white/80 hover:bg-white/10" aria-label="close">
              <X className="h-5 w-5" />
            </button>
          </aside>
        </div>
      )}

      <div className="lg:ps-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-ink-100 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button onClick={() => setOpen(true)} className="rounded-lg p-1.5 text-ink-600 hover:bg-ink-100 lg:hidden" aria-label="menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="truncate text-sm font-medium text-ink-600">{me?.tenant ? n(me.tenant) : ''}</div>
          <div className="ms-auto flex items-center gap-1">
            <LangToggle />
            <Link href={profileHref} className="rounded-lg p-2 text-ink-600 hover:bg-ink-100" aria-label={t('common.profile')}>
              <UserRound className="h-5 w-5" />
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          {isLoading ? (
            <div className="flex justify-center py-24">
              <Spinner />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
