/** The municipality's time zone for schedules and report periods (APP_TZ, default Palestine). */
export const APP_TZ = process.env.APP_TZ || 'Asia/Hebron';

/** Minutes to add to UTC to get local time in `tz` at `date`. */
function offsetMinutes(date: Date, tz: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(date).map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return Math.round((asUtc - date.getTime()) / 60_000);
}

/** Local calendar date (YYYY-MM-DD) of `date` in `tz`. */
export function localDate(date: Date, tz = APP_TZ) {
  return new Date(date.getTime() + offsetMinutes(date, tz) * 60_000).toISOString().slice(0, 10);
}

/** The instant of local midnight at the start of the given local date (YYYY-MM-DD). */
export function localMidnight(ymd: string, tz = APP_TZ) {
  const guess = new Date(`${ymd}T00:00:00Z`);
  return new Date(guess.getTime() - offsetMinutes(guess, tz) * 60_000);
}

/** Adds days to a YYYY-MM-DD date. */
export function addDays(ymd: string, n: number) {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** First day of the month of a YYYY-MM-DD date, moved by `months`. */
export function monthStart(ymd: string, months = 0) {
  const d = new Date(`${ymd.slice(0, 7)}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}
