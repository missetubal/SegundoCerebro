/**
 * ISO weekday: 1 = Monday … 7 = Sunday.
 * JS `Date#getDay()` / `getUTCDay()`: 0 = Sunday … 6 = Saturday.
 */
export function jsWeekdayToIso(jsWeekday: number): number {
  return jsWeekday === 0 ? 7 : jsWeekday;
}

export function isoWeekdayToJs(isoWeekday: number): number {
  return isoWeekday === 7 ? 0 : isoWeekday;
}

/** Calendar date `YYYY-MM-DD` in the given IANA time zone (defaults to UTC parts of `at`). */
export function calendarDateInTimeZone(
  timeZone: string,
  at: Date = new Date(),
): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(at);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  if (!year || !month || !day) {
    throw new Error(`Could not format calendar date for time zone ${timeZone}`);
  }
  return `${year}-${month}-${day}`;
}

/** ISO weekday for a calendar `YYYY-MM-DD` (interpreted as UTC noon to avoid DST edges). */
export function isoWeekdayFromDateYmd(dateYmd: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateYmd);
  if (!match) {
    throw new Error(`Invalid calendar date: ${dateYmd}`);
  }
  const [, year, month, day] = match;
  const utc = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), 12),
  );
  return jsWeekdayToIso(utc.getUTCDay());
}
