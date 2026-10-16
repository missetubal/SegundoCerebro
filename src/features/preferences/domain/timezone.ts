// Returns the canonical IANA name, or null. Offset zones like "+03:00" are
// valid for Intl but are not IANA identifiers, so they are rejected.
export function normalizeTimeZone(value: string): string | null {
  try {
    const resolved = new Intl.DateTimeFormat('en-US', {
      timeZone: value,
    }).resolvedOptions().timeZone;
    return /^[+-]/.test(resolved) ? null : resolved;
  } catch {
    return null;
  }
}
