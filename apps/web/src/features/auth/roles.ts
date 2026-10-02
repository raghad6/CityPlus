import type { Role } from '@/lib/types';

/**
 * Who goes where. The API enforces every permission on each request;
 * these rules only decide which area of the web app a role sees.
 *
 *   SUPER_ADMIN  platform owner     → /platform  (manage municipalities)
 *   ADMIN        municipality admin → /admin     (everything in their municipality; may also use /portal)
 *   STAFF        employee / partner → /portal    (only projects assigned to them)
 */

/** Name of the httpOnly cookie that holds the login token (set by the API). */
export const SESSION_COOKIE = 'cityplus_token';

/** Each role's home page after signing in. */
export const ROLE_HOME: Record<Role, string> = {
  SUPER_ADMIN: '/platform',
  ADMIN: '/admin',
  STAFF: '/portal',
};

/** Which roles may open each area of the app. */
export const AREA_ROLES: Record<string, Role[]> = {
  '/admin': ['ADMIN'],
  '/portal': ['STAFF', 'ADMIN'],
  '/platform': ['SUPER_ADMIN'],
};

export const homeFor = (role: string | undefined) => ROLE_HOME[role as Role] ?? '/login';
