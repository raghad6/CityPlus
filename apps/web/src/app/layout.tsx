import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import '@fontsource/ibm-plex-sans-arabic/300.css';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/ibm-plex-sans-arabic/700.css';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  // \u200E (left-to-right mark) keeps the + after the name in Arabic page titles
  title: { default: 'City+', template: '%s | City+\u200E' },
  description: 'منصة متابعة وتقييم الخطة التنموية للهيئات المحلية',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = { themeColor: '#156253', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = cookies().get('cityplus_lang')?.value === 'en' ? 'en' : 'ar';
  return (
    <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <body className="font-sans">
        <Providers lang={lang}>{children}</Providers>
      </body>
    </html>
  );
}
