const UNIQUE_VIOLATION = '23505';

function hasCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

export function isUniqueViolation(error: unknown): boolean {
  if (hasCode(error, UNIQUE_VIOLATION)) return true;
  return (
    error instanceof Error && hasCode(error.cause, UNIQUE_VIOLATION)
  );
}
