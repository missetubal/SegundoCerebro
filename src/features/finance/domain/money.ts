export const CURRENCIES = ['BRL', 'USD', 'EUR'] as const;
export type Currency = (typeof CURRENCIES)[number];

const CENT_SCALE = 100n;

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}

/** Parses a decimal money string into minor units. Rejects fractions finer than one cent. */
export function parseAmountToMinor(input: string): bigint | null {
  const trimmed = input
    .trim()
    .replace(/\s/g, '')
    .replace(/^(R\$|US\$|€)/, '');
  const match = trimmed.match(/^(-)?(\d+)(?:[.,](\d{1,2}))?$/);
  if (!match) return null;
  const sign = match[1] ? -1n : 1n;
  const whole = BigInt(match[2]);
  const fraction = (match[3] ?? '').padEnd(2, '0');
  return sign * (whole * CENT_SCALE + BigInt(fraction || '0'));
}

export function addMinor(left: bigint, right: bigint): bigint {
  return left + right;
}

export function formatMinor(amount: bigint, currency: Currency): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(Number(amount) / 100);
}
