// Relies on the hosting proxy (Vercel) overwriting x-forwarded-for; behind a
// proxy that passes the client value through, this header can be spoofed.
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip')?.trim() || 'unknown';
}
