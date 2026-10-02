'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ar, en, type DictKey } from './dict';

export type Lang = 'ar' | 'en';
const dicts = { ar, en } as const;

interface I18n {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  /** Pick the localized name of an entity with name / nameEn. */
  n: (o?: { name?: string | null; nameEn?: string | null } | null) => string;
  setLang: (l: Lang) => void;
}

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ initialLang, children }: { initialLang: Lang; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((l: Lang) => {
    document.cookie = `cityplus_lang=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    setLangState(l);
  }, []);

  const value = useMemo<I18n>(() => {
    const dict = dicts[lang];
    return {
      lang,
      dir: lang === 'ar' ? 'rtl' : 'ltr',
      t: (key, vars) => {
        let s: string = dict[key] ?? ar[key] ?? key;
        if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
        return s;
      },
      n: (o) => (!o ? '—' : lang === 'en' && o.nameEn ? o.nameEn : o.name ?? '—'),
      setLang,
    };
  }, [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useI18n outside I18nProvider');
  return ctx;
}
