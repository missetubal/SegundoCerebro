import type { Currency } from './money';
import type { Direction, TransactionType } from './validation';

export const UNCATEGORIZED_LABEL = 'Sem categoria';

export type LedgerRow = {
  amountMinor: bigint;
  currency: Currency;
  type: TransactionType;
  direction: Direction;
  categoryName: string | null;
  accountId: string | null;
  creditCardId: string | null;
};

export type MoneyTotals = {
  currency: Currency;
  expenseMinor: bigint;
  incomeMinor: bigint;
  periodBalanceMinor: bigint;
};

export type NamedTotal = {
  id: string | null;
  name: string;
  amountMinor: bigint;
};

function categoryKey(name: string | null): string {
  return name && name.trim() !== '' ? name : UNCATEGORIZED_LABEL;
}

export function countsTowardSpending(type: TransactionType): boolean {
  return type === 'expense' || type === 'refund';
}

export function summarizePeriod(
  rows: LedgerRow[],
  currency: Currency,
): MoneyTotals {
  let expenseMinor = 0n;
  let incomeMinor = 0n;
  for (const row of rows) {
    if (row.currency !== currency) continue;
    if (row.type === 'expense') expenseMinor += row.amountMinor;
    if (row.type === 'refund') expenseMinor -= row.amountMinor;
    if (row.type === 'income') incomeMinor += row.amountMinor;
  }
  return {
    currency,
    expenseMinor,
    incomeMinor,
    periodBalanceMinor: incomeMinor - expenseMinor,
  };
}

export function currenciesIn(rows: LedgerRow[]): Currency[] {
  return [...new Set(rows.map((row) => row.currency))];
}

export function totalsByCategory(
  rows: LedgerRow[],
  currency: Currency,
): NamedTotal[] {
  const totals = new Map<string, bigint>();
  for (const row of rows) {
    if (row.currency !== currency || !countsTowardSpending(row.type)) continue;
    const name = categoryKey(row.categoryName);
    const signed = row.type === 'refund' ? -row.amountMinor : row.amountMinor;
    totals.set(name, (totals.get(name) ?? 0n) + signed);
  }
  return [...totals.entries()].map(([name, amountMinor]) => ({
    id: name === UNCATEGORIZED_LABEL ? null : name,
    name,
    amountMinor,
  }));
}

export function totalsByInstrument(
  rows: LedgerRow[],
  currency: Currency,
  kind: 'account' | 'card',
): NamedTotal[] {
  const totals = new Map<string, bigint>();
  for (const row of rows) {
    if (row.currency !== currency || !countsTowardSpending(row.type)) continue;
    const id = kind === 'account' ? row.accountId : row.creditCardId;
    if (!id) continue;
    const signed = row.type === 'refund' ? -row.amountMinor : row.amountMinor;
    totals.set(id, (totals.get(id) ?? 0n) + signed);
  }
  return [...totals.entries()].map(([id, amountMinor]) => ({
    id,
    name: id,
    amountMinor,
  }));
}

export type SpendingOrigin = 'all' | 'account' | 'card';

export function filterByOrigin<T extends Pick<LedgerRow, 'accountId' | 'creditCardId'>>(
  rows: T[],
  origin: SpendingOrigin,
): T[] {
  if (origin === 'account') return rows.filter((row) => row.accountId !== null);
  if (origin === 'card') return rows.filter((row) => row.creditCardId !== null);
  return rows;
}

export function spendingByMonth(
  rows: Array<LedgerRow & { month: string }>,
  months: string[],
  currency: Currency,
  origin: SpendingOrigin,
): Array<{ month: string; amountMinor: bigint }> {
  return months.map((month) => ({
    month,
    amountMinor: totalsByCategory(
      filterByOrigin(
        rows.filter((row) => row.month === month && row.currency === currency),
        origin,
      ),
      currency,
    ).reduce((sum, row) => sum + row.amountMinor, 0n),
  }));
}

export function accountBalance(
  openingBalanceMinor: bigint,
  rows: LedgerRow[],
  accountId: string,
): bigint {
  let balance = openingBalanceMinor;
  for (const row of rows) {
    if (row.accountId !== accountId) continue;
    balance += row.direction === 'inflow' ? row.amountMinor : -row.amountMinor;
  }
  return balance;
}

export type Reconciliation = {
  checkedMinor: bigint;
  incomeMinor: bigint;
  paymentMinor: bigint;
  transferMinor: bigint;
  differenceMinor: bigint | null;
};

export function reconcileIncluded(
  rows: Array<Pick<LedgerRow, 'type' | 'amountMinor'>>,
  declaredTotalMinor: bigint | null,
): Reconciliation {
  let expenses = 0n;
  let refunds = 0n;
  let incomeMinor = 0n;
  let paymentMinor = 0n;
  let transferMinor = 0n;
  for (const row of rows) {
    if (row.type === 'expense') expenses += row.amountMinor;
    if (row.type === 'refund') refunds += row.amountMinor;
    if (row.type === 'income') incomeMinor += row.amountMinor;
    if (row.type === 'invoice_payment') paymentMinor += row.amountMinor;
    if (row.type === 'transfer') transferMinor += row.amountMinor;
  }
  const checkedMinor = expenses - refunds;
  return {
    checkedMinor,
    incomeMinor,
    paymentMinor,
    transferMinor,
    differenceMinor:
      declaredTotalMinor === null ? null : declaredTotalMinor - checkedMinor,
  };
}
