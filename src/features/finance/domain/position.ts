const QUANTITY_SCALE = 100_000_000n;

export type OperationType = 'buy' | 'sell' | 'income' | 'adjustment';

export type PositionOperation = {
  operationType: OperationType;
  operationDate: string;
  createdAt: string;
  quantity: string;
  unitPriceMinor: bigint;
  feesMinor: bigint;
};

export type Position = {
  quantityScaled: bigint;
  costMinor: bigint;
};

export type PositionResult =
  | { ok: true; position: Position }
  | { ok: false; reason: 'invalid_quantity' | 'sell_exceeds' };

export function quantityToScaled(quantity: string): bigint | null {
  if (!/^\d+(\.\d{1,8})?$/.test(quantity)) return null;
  const [whole, fraction = ''] = quantity.split('.');
  const scaledFraction = fraction.padEnd(8, '0');
  return BigInt(whole) * QUANTITY_SCALE + BigInt(scaledFraction);
}

export function scaledToQuantity(quantityScaled: bigint): string {
  const whole = quantityScaled / QUANTITY_SCALE;
  const fraction = (quantityScaled % QUANTITY_SCALE)
    .toString()
    .padStart(8, '0')
    .replace(/0+$/, '');
  return fraction.length > 0 ? `${whole}.${fraction}` : whole.toString();
}

/** Half away from zero. `numerator / denominator`. */
export function roundHalfAwayFromZero(
  numerator: bigint,
  denominator: bigint,
): bigint {
  if (denominator === 0n) throw new Error('Cannot divide by zero');
  const negative = numerator < 0n;
  const absolute = negative ? -numerator : numerator;
  const quotient = absolute / denominator;
  const remainder = absolute % denominator;
  const rounded = remainder * 2n >= denominator ? quotient + 1n : quotient;
  return negative ? -rounded : rounded;
}

function monetaryProduct(quantityScaled: bigint, unitPriceMinor: bigint): bigint {
  return roundHalfAwayFromZero(
    quantityScaled * unitPriceMinor,
    QUANTITY_SCALE,
  );
}

export function averageCostMinor(position: Position): bigint | null {
  if (position.quantityScaled === 0n) return null;
  return roundHalfAwayFromZero(position.costMinor * QUANTITY_SCALE, position.quantityScaled);
}

export function applyOperations(operations: PositionOperation[]): PositionResult {
  const ordered = [...operations].sort((left, right) => {
    const byDate = left.operationDate.localeCompare(right.operationDate);
    if (byDate !== 0) return byDate;
    return left.createdAt.localeCompare(right.createdAt);
  });
  let position: Position = { quantityScaled: 0n, costMinor: 0n };
  for (const operation of ordered) {
    const quantityScaled = quantityToScaled(operation.quantity);
    if (quantityScaled === null) return { ok: false, reason: 'invalid_quantity' };
    if (operation.operationType === 'income') continue;
    if (operation.operationType === 'adjustment') {
      position = {
        quantityScaled,
        costMinor:
          quantityScaled === 0n
            ? 0n
            : monetaryProduct(quantityScaled, operation.unitPriceMinor),
      };
      continue;
    }
    if (operation.operationType === 'buy') {
      position = {
        quantityScaled: position.quantityScaled + quantityScaled,
        costMinor:
          position.costMinor +
          monetaryProduct(quantityScaled, operation.unitPriceMinor) +
          operation.feesMinor,
      };
      continue;
    }
    if (quantityScaled > position.quantityScaled) {
      return { ok: false, reason: 'sell_exceeds' };
    }
    const reduction =
      position.quantityScaled === 0n
        ? 0n
        : roundHalfAwayFromZero(
            position.costMinor * quantityScaled,
            position.quantityScaled,
          );
    const nextQuantity = position.quantityScaled - quantityScaled;
    position = {
      quantityScaled: nextQuantity,
      costMinor: nextQuantity === 0n ? 0n : position.costMinor - reduction,
    };
  }
  return { ok: true, position };
}
