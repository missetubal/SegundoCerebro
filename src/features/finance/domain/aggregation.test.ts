import { describe, expect, it } from 'vitest';
import {
  accountBalance,
  summarizePeriod,
  totalsByCategory,
  totalsByInstrument,
  UNCATEGORIZED_LABEL,
  type LedgerRow,
} from './aggregation';

function row(overrides: Partial<LedgerRow> & Pick<LedgerRow, 'type' | 'amountMinor'>): LedgerRow {
  return {
    currency: 'BRL',
    direction: overrides.type === 'expense' ? 'outflow' : 'inflow',
    categoryName: null,
    accountId: 'account-1',
    creditCardId: null,
    ...overrides,
  };
}

describe('aggregation', () => {
  it('nets refunds and keeps payments out of spending and income', () => {
    const rows = [
      row({ type: 'income', amountMinor: 10000n, categoryName: null }),
      row({ type: 'expense', amountMinor: 4000n, categoryName: 'Mercado' }),
      row({ type: 'refund', amountMinor: 1000n, categoryName: 'Mercado' }),
      row({
        type: 'invoice_payment',
        amountMinor: 50000n,
        direction: 'outflow',
      }),
    ];
    const summary = summarizePeriod(rows, 'BRL');
    expect(summary.expenseMinor).toBe(3000n);
    expect(summary.incomeMinor).toBe(10000n);
    expect(summary.periodBalanceMinor).toBe(7000n);
  });

  it('puts an uncategorized refund in Sem categoria', () => {
    const totals = totalsByCategory(
      [
        row({ type: 'expense', amountMinor: 1500n }),
        row({ type: 'expense', amountMinor: 2000n, categoryName: 'Mercado' }),
      ],
      'BRL',
    );
    expect(totals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: UNCATEGORIZED_LABEL,
          amountMinor: 1500n,
        }),
        expect.objectContaining({ name: 'Mercado', amountMinor: 2000n }),
      ]),
    );
  });

  it('does not mix currencies', () => {
    const rows = [
      row({ type: 'expense', amountMinor: 100n }),
      row({ type: 'expense', amountMinor: 200n, currency: 'USD' }),
    ];
    expect(summarizePeriod(rows, 'BRL').expenseMinor).toBe(100n);
    expect(summarizePeriod(rows, 'USD').expenseMinor).toBe(200n);
  });

  it('keeps card spend out of the account balance', () => {
    const rows = [
      row({ type: 'expense', amountMinor: 4000n, accountId: 'account-1' }),
      row({
        type: 'expense',
        amountMinor: 9000n,
        accountId: null,
        creditCardId: 'card-1',
        direction: 'outflow',
      }),
    ];
    expect(accountBalance(10000n, rows, 'account-1')).toBe(6000n);
    expect(totalsByInstrument(rows, 'BRL', 'card')).toEqual([
      expect.objectContaining({ id: 'card-1', amountMinor: 9000n }),
    ]);
  });

  it('shows zero spending when the month is only an invoice payment', () => {
    const summary = summarizePeriod(
      [
        row({
          type: 'invoice_payment',
          amountMinor: 50000n,
          direction: 'outflow',
        }),
      ],
      'BRL',
    );
    expect(summary.expenseMinor).toBe(0n);
    expect(summary.incomeMinor).toBe(0n);
  });
});
