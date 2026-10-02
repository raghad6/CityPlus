import { Prisma } from '@prisma/client';

/** Convert Prisma Decimal fields to plain numbers for JSON responses. */
export function plain<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_k, v) => (v instanceof Prisma.Decimal ? Number(v) : v)),
  );
}

export const num = (v: Prisma.Decimal | number | null | undefined) => (v == null ? 0 : Number(v));
