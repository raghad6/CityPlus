/** Low-level HTTP client. The browser only calls /api/* on its own origin; Next.js forwards it to the API. */
export class ApiError extends Error {
  status: number;
  code?: string;
  fields?: string[];
  constructor(status: number, body: any) {
    const msg = body?.message;
    super(typeof msg === 'string' ? msg : Array.isArray(msg) ? msg.join(', ') : `HTTP ${status}`);
    this.status = status;
    this.code = body?.code ?? (typeof body?.message === 'object' ? body.message?.code : undefined);
    this.fields = body?.fields;
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

export function qs(params?: Query) {
  if (!params) return '';
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') s.set(k, String(v));
  const str = s.toString();
  return str ? `?${str}` : '';
}

async function request<T>(method: string, path: string, body?: unknown, query?: Query): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const res = await fetch(`/api${path}${qs(query)}`, {
    method,
    credentials: 'include',
    headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? (isForm ? (body as FormData) : JSON.stringify(body)) : undefined,
  });
  if (res.status === 401 && typeof window !== 'undefined' && !path.startsWith('/auth/login')) {
    // Session is no longer valid (expired, disabled user, suspended municipality): clear the cookie and sign in again.
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
    if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

export const http = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, undefined, query),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body ?? {}),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),
  del: <T>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, form: FormData) => request<T>('POST', path, form),
  /** Absolute URL for file downloads (Excel export). */
  url: (path: string, query?: Query) => `/api${path}${qs(query)}`,
};
