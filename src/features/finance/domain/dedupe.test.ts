import { describe, expect, it } from 'vitest';
import { dedupeHash, markDuplicates, type DedupeIdentity } from './dedupe';

const base: DedupeIdentity = {
  instrumentKind: 'account',
  instrumentId: 'acc-1',
  transactionDate: '2026-04-02',
  amountMinor: 1890n,
  description: 'Padaria',
  externalId: null,
};

describe('dedupe', () => {
  it('flags a matching description without removing the proposed line', () => {
    const marked = markDuplicates(
      [{ ...base, description: '  padaria  ' }],
      [{ ...base, id: 'saved-1' }],
    );
    expect(marked).toHaveLength(1);
    expect(marked[0]?.duplicate).toBe(true);
    expect(dedupeHash(base)).toBe(dedupeHash({ ...base, description: 'PADARIA' }));
  });

  it('flags the same external id even when the description differs', () => {
    const marked = markDuplicates(
      [{ ...base, description: 'Outro', externalId: 'fit-1' }],
      [{ ...base, id: 'saved-1', description: 'Padaria', externalId: 'fit-1' }],
    );
    expect(marked[0]?.duplicate).toBe(true);
  });

  it('does not flag a different amount', () => {
    const marked = markDuplicates(
      [{ ...base, amountMinor: 2000n }],
      [{ ...base, id: 'saved-1' }],
    );
    expect(marked[0]?.duplicate).toBe(false);
  });
});
