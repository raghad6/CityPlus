import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="text-6xl font-bold text-brand-700">404</div>
      <p className="text-ink-600">الصفحة غير موجودة · Page not found</p>
      <Link href="/" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white">الرئيسية · Home</Link>
    </div>
  );
}
