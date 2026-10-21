import { createHash } from 'node:crypto';
import type { Currency } from './money';

export type DedupeIdentity = {
  instrumentKind: 'account' | 'card';
  instrumentId: string;
  transactionDate: string;
  amountMinor: bigint;
  description: string;
  externalId: string | null;
};

export function normalizeDescription(description: string): string {
  return description.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function dedupeHash(identity: DedupeIdentity): string {
  const payload = [
    identity.instrumentKind,
    identity.instrumentId,
    identity.transactionDate,
    identity.amountMinor.toString(),
    normalizeDescription(identity.description),
  ].join('|');
  return createHash('sha256').update(payload).digest('hex');
}

export type DuplicateCandidate = DedupeIdentity & { id: string };

export function markDuplicates<T extends DedupeIdentity>(
  proposed: T[],
  existing: DuplicateCandidate[],
): Array<T & { duplicate: boolean }> {
  return proposed.map((line) => ({
    ...line,
    duplicate: existing.some((saved) => isDuplicate(line, saved)),
  }));
}

function isDuplicate(line: DedupeIdentity, saved: DuplicateCandidate): boolean {
  if (
    line.instrumentKind !== saved.instrumentKind ||
    line.instrumentId !== saved.instrumentId
  ) {
    return false;
  }
  if (
    line.externalId &&
    saved.externalId &&
    line.externalId === saved.externalId
  ) {
    return true;
  }
  return (
    line.transactionDate === saved.transactionDate &&
    line.amountMinor === saved.amountMinor &&
    normalizeDescription(line.description) ===
      normalizeDescription(saved.description)
  );
}

export function signedAmountMatches(
  left: bigint,
  right: bigint,
  _currency: Currency,
): boolean {
  return left === right;
}
