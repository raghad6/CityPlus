import { http } from '@/lib/http';
import type { SettingsInput, TenantSettings } from './types';

export const settingsApi = {
  get: () => http.get<TenantSettings>('/settings'),
  update: (body: SettingsInput) => http.patch<TenantSettings>('/settings', body),
};
