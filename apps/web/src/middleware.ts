import { NextResponse, type NextRequest } from 'next/server';
import { decodeJwt } from 'jose';
import type { Role } from '@/lib/types';
import { AREA_ROLES, SESSION_COOKIE } from '@/features/auth/roles';

// Coarse routing only — the API enforces every permission on each request. Role rules live in features/auth/roles.ts.

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const area = Object.keys(AREA_ROLES).find((a) => pathname === a || pathname.startsWith(a + '/'));
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  let role: Role | undefined;
  let expired = false;
  if (token) {
    try {
      const p = decodeJwt(token);
      role = p.role as Role;
      expired = !!p.exp && p.exp * 1000 < Date.now();
    } catch {
      role = undefined;
    }
  }

  if ((pathname === '/login' || pathname === '/signup') && role && !expired) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  if (!area) return NextResponse.next();
  if (!role || expired) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  if (!AREA_ROLES[area].includes(role)) return NextResponse.redirect(new URL('/', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*', '/portal/:path*', '/platform/:path*', '/login', '/signup'] };
