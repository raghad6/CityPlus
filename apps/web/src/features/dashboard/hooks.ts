'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from './api';

/** Everything under 'dashboard' is derived from projects, reports and users; other features refresh it after changes. */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  admin: (year: string) => ['dashboard', 'admin', year] as const,
  staff: ['dashboard', 'staff'] as const,
  calendar: (month: string) => ['dashboard', 'calendar', month] as const,
};

export function useAdminDashboard(year: string) {
  return useQuery({ queryKey: dashboardKeys.admin(year), queryFn: () => dashboardApi.admin(year) });
}

export function useStaffDashboard() {
  return useQuery({ queryKey: dashboardKeys.staff, queryFn: dashboardApi.staff });
}

export function useCalendar(month: string) {
  return useQuery({ queryKey: dashboardKeys.calendar(month), queryFn: () => dashboardApi.calendar(month) });
}
