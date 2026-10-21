import { describe, expect, it } from 'vitest';
import {
  applyOperations,
  averageCostMinor,
  quantityToScaled,
  type PositionOperation,
} from './position';

function operation(
  overrides: Partial<PositionOperation> & Pick<PositionOperation, 'operationType'>,
): PositionOperation {
  return {
    operationDate: '2026-04-01',
    createdAt: '2026-04-01T00:00:00.000Z',
    quantity: '1',
    unitPriceMinor: 1000n,
    feesMinor: 0n,
    ...overrides,
  };
}

describe('position', () => {
  it('computes average cost after a buy', () => {
    const result = applyOperations([
      operation({ operationType: 'buy', quantity: '2', unitPriceMinor: 1000n }),
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.position.quantityScaled).toBe(quantityToScaled('2'));
    expect(averageCostMinor(result.position)).toBe(1000n);
  });

  it('keeps average cost after a partial sale and ignores the sell fee', () => {
    const result = applyOperations([
      operation({ operationType: 'buy', quantity: '2', unitPriceMinor: 1000n }),
      operation({
        operationType: 'sell',
        quantity: '1',
        operationDate: '2026-04-02',
        feesMinor: 50n,
      }),
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.position.quantityScaled).toBe(quantityToScaled('1'));
    expect(averageCostMinor(result.position)).toBe(1000n);
  });

  it('rejects a sale above the position', () => {
    const result = applyOperations([
      operation({ operationType: 'buy', quantity: '10' }),
      operation({
        operationType: 'sell',
        quantity: '11',
        operationDate: '2026-04-02',
      }),
    ]);
    expect(result).toEqual({ ok: false, reason: 'sell_exceeds' });
  });

  it('ignores income for quantity and average cost', () => {
    const result = applyOperations([
      operation({ operationType: 'buy', quantity: '10', unitPriceMinor: 2000n }),
      operation({
        operationType: 'income',
        quantity: '10',
        unitPriceMinor: 100n,
        operationDate: '2026-04-03',
      }),
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.position.quantityScaled).toBe(quantityToScaled('10'));
    expect(averageCostMinor(result.position)).toBe(2000n);
  });

  it('replaces quantity and average cost on adjustment', () => {
    const result = applyOperations([
      operation({ operationType: 'buy', quantity: '2', unitPriceMinor: 1000n }),
      operation({
        operationType: 'adjustment',
        quantity: '5',
        unitPriceMinor: 800n,
        operationDate: '2026-04-04',
      }),
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.position.quantityScaled).toBe(quantityToScaled('5'));
    expect(averageCostMinor(result.position)).toBe(800n);
  });

  it('zeroes cost when quantity reaches zero', () => {
    const result = applyOperations([
      operation({ operationType: 'adjustment', quantity: '0', unitPriceMinor: 800n }),
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.position.quantityScaled).toBe(0n);
    expect(result.position.costMinor).toBe(0n);
    expect(averageCostMinor(result.position)).toBeNull();
  });
});
