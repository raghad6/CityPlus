'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';

/** Page building blocks: Card, CardHeader, PageHeader and the Stat tile. */

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-xl border border-ink-100 bg-white shadow-card', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 px-5 pt-5', className)}>
      <div className="min-w-0">
        <h3 className="font-semibold text-ink-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, back }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; back?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back}
        <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({
  label, value, sub, icon, tone = 'brand', href,
}: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: React.ReactNode; tone?: 'brand' | 'accent' | 'amber' | 'sky'; href?: string }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    accent: 'bg-accent-50 text-accent-700',
    amber: 'bg-amber-50 text-amber-700',
    sky: 'bg-sky-50 text-sky-700',
  };
  const inner = (
    <Card className={cn('flex items-start gap-4 p-5', href && 'transition hover:border-brand-200 hover:shadow-pop')}>
      {icon && <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', tones[tone])}>{icon}</div>}
      <div className="min-w-0">
        <div className="text-sm text-ink-500">{label}</div>
        <div className="mt-1 text-2xl font-bold text-ink-900 tabular-nums">{value}</div>
        {sub && <div className="mt-0.5 text-xs text-ink-500">{sub}</div>}
      </div>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
