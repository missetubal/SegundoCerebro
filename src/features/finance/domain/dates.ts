export function nextDueDate(dueDay: number, today: string): string {
  const [year, month] = today.split('-').map(Number);
  const current = clampDate(year, month, dueDay);
  if (current >= today) return current;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return clampDate(nextYear, nextMonth, dueDay);
}

export function monthInTimeZone(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
  }).format(now);
  return parts.slice(0, 7);
}

export function todayInTimeZone(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function clampDate(year: number, month: number, dueDay: number): string {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(dueDay, lastDay);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
