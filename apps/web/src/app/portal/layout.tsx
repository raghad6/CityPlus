'use client';

import { FileText, FolderKanban, Home, LayoutDashboard } from 'lucide-react';
import { AppShell, type NavItem } from '@/components/layout/AppShell';
import { useMe } from '@/features/auth/hooks';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { data: me } = useMe();
  const nav: NavItem[] = [
    { href: '/portal', label: 'nav.home', icon: Home, exact: true },
    { href: '/portal/projects', label: 'nav.myProjects', icon: FolderKanban },
    { href: '/portal/reports', label: 'nav.myReports', icon: FileText },
    ...(me?.role === 'ADMIN' ? [{ href: '/admin', label: 'nav.adminPanel', icon: LayoutDashboard } as NavItem] : []),
  ];
  return <AppShell nav={nav} profileHref="/portal/profile">{children}</AppShell>;
}
