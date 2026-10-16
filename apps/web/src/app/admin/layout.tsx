'use client';

import { Building2, ClipboardCheck, FileBarChart, FolderKanban, History, LayoutDashboard, Settings, Users } from 'lucide-react';
import { AppShell, type NavItem } from '@/components/layout/AppShell';
import { useReports } from '@/features/reports/hooks';
import { usePendingUsers } from '@/features/users/hooks';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Badge counts in the sidebar
  const pendingReports = useReports({ status: 'PENDING' });
  const pendingUsers = usePendingUsers();

  const nav: NavItem[] = [
    { href: '/admin', label: 'nav.dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/projects', label: 'nav.projects', icon: FolderKanban },
    { href: '/admin/reports', label: 'nav.reports', icon: ClipboardCheck, badge: pendingReports.data?.length },
    { href: '/admin/summaries', label: 'nav.summaries', icon: FileBarChart },
    { href: '/admin/users', label: 'nav.users', icon: Users, badge: pendingUsers.data?.length },
    { href: '/admin/departments', label: 'nav.departments', icon: Building2 },
    { href: '/admin/activity', label: 'nav.activity', icon: History },
    { href: '/admin/settings', label: 'nav.settings', icon: Settings },
  ];
  return <AppShell nav={nav} profileHref="/admin/profile">{children}</AppShell>;
}
