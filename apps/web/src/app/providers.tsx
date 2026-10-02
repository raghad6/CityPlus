'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { I18nProvider, type Lang } from '@/lib/i18n';

export function Providers({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const [qc] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }),
  );
  return (
    <I18nProvider initialLang={lang}>
      <QueryClientProvider client={qc}>
        {children}
        <Toaster position="top-center" richColors closeButton dir={lang === 'ar' ? 'rtl' : 'ltr'} />
      </QueryClientProvider>
    </I18nProvider>
  );
}
