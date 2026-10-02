'use client';

import { BarChart3, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { LangToggle, Logo } from '@/components/layout/AppShell';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const features = [
    { icon: BarChart3, text: t('auth.hero.f1') },
    { icon: CheckCircle2, text: t('auth.hero.f2') },
    { icon: FileSpreadsheet, text: t('auth.hero.f3') },
  ];
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-6 py-6 sm:px-12">
        <div className="flex items-center justify-between">
          <Logo subtitle={t('app.tagline')} />
          <LangToggle />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-brand-900 lg:block">
        {/* Abstract city-plan pattern: a nod to the blueprint background of the prototype */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.12]" aria-hidden>
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M48 0H0V48" fill="none" stroke="#fff" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <path d="M-20 520 C 200 420, 320 640, 560 480 S 900 300, 1200 380" fill="none" stroke="#fff" strokeWidth="18" strokeLinecap="round" />
          <path d="M120 -20 L 260 900" fill="none" stroke="#fff" strokeWidth="10" />
          <path d="M-20 200 L 1200 260" fill="none" stroke="#fff" strokeWidth="6" />
          <rect x="360" y="120" width="140" height="90" rx="6" fill="#fff" />
          <rect x="560" y="560" width="190" height="120" rx="6" fill="#fff" />
          <rect x="300" y="640" width="90" height="140" rx="6" fill="#fff" />
          <circle cx="700" cy="220" r="60" fill="none" stroke="#fff" strokeWidth="8" />
        </svg>
        <div className="relative flex h-full flex-col justify-end p-14 text-white">
          <h2 className="max-w-md text-4xl font-bold leading-tight">{t('auth.hero.title')}</h2>
          <p className="mt-4 max-w-md text-lg text-brand-100">{t('auth.hero.body')}</p>
          <ul className="mt-8 space-y-3">
            {features.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-brand-50">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <f.icon className="h-5 w-5" />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
