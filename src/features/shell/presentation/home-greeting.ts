/** Greeting label for the user's local hour in `timeZone`. */
export function greetingForHour(timeZone: string): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
  );
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Long weekday + date label for a calendar `YYYY-MM-DD` in `timeZone`. */
export function formatLongDate(dateYmd: string, timeZone: string): string {
  const [year, month, day] = dateYmd.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}
