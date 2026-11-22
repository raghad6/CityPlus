'use client';

import { Building, LayoutDashboard } from 'lucide-react';
import { AppShell, type NavItem } from '@/components/layout/AppShell';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const nav: NavItem[] = [
    { href: '/platform-owner', label: 'nav.overview', icon: LayoutDashboard, exact: true },
    { href: '/platform-owner/tenants/new', label: 'platform.newTenant', icon: Building },
  ];
  return <AppShell nav={nav} profileHref="/platform-owner/profile">{children}</AppShell>;
}
