import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import { homeFor, SESSION_COOKIE } from '@/features/auth/roles';

/** Send each role to its own area. */
export default function Home() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) redirect('/login');
  let role: string | undefined;
  try {
    role = decodeJwt(token).role as string;
  } catch {
    redirect('/login');
  }
  redirect(homeFor(role));
}
