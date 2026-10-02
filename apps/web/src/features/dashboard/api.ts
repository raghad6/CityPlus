import { http } from '@/lib/http';
import type { AdminDashboard, CalendarEvent, StaffDashboard } from './types';

export const dashboardApi = {
  admin: (planYear?: string) => http.get<AdminDashboard>('/dashboard', { planYear: planYear || undefined }),
  staff: () => http.get<StaffDashboard>('/dashboard/me'),
  /** `month` is YYYY-MM. Only projects the user may see. */
  calendar: (month: string) => http.get<CalendarEvent[]>('/dashboard/calendar', { month }),
};
