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
  const byExternalId = new Set<string>();
  const byFingerprint = new Set<string>();
  for (const saved of existing) {
    if (saved.externalId) {
      byExternalId.add(`${saved.instrumentKind}|${saved.instrumentId}|${saved.externalId}`);
    }
    byFingerprint.add(fingerprint(saved));
  }
  return proposed.map((line) => ({
    ...line,
    duplicate:
      (line.externalId !== null &&
        byExternalId.has(
          `${line.instrumentKind}|${line.instrumentId}|${line.externalId}`,
        )) ||
      byFingerprint.has(fingerprint(line)),
  }));
}

function fingerprint(identity: DedupeIdentity): string {
  return [
    identity.instrumentKind,
    identity.instrumentId,
    identity.transactionDate,
    identity.amountMinor.toString(),
    normalizeDescription(identity.description),
  ].join('|');
}

export function signedAmountMatches(
  left: bigint,
  right: bigint,
  _currency: Currency,
): boolean {
  return left === right;
}
