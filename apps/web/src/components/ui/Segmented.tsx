'use client';

import { cn } from '@/lib/cn';

/** Tab-like switch between a few options, with an optional count bubble. */
export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode; count?: number }[] }) {
  return (
    <div className="inline-flex rounded-lg bg-ink-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition',
            value === o.value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-600 hover:text-ink-900',
          )}
        >
          {o.label}
          {o.count != null && o.count > 0 && (
            <span className="rounded-full bg-accent-600 px-1.5 text-[11px] leading-5 text-white">{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
