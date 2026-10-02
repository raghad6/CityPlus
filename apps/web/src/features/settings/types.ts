/** The admin's own municipality settings and subscription usage. */
export interface TenantSettings {
  id: string; name: string; nameEn?: string | null; city?: string | null; logoUrl?: string | null; planYear: number;
  requireApproval: boolean; plan: 'BASIC' | 'STANDARD' | 'PREMIUM'; maxUsers: number; slug: string; _count: { users: number };
}

export interface SettingsInput {
  name: string; nameEn?: string; city?: string; logoUrl?: string; planYear: number; requireApproval: boolean;
}
