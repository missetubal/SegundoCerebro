import { afterAll, describe, expect, it, vi } from 'vitest';
import { requireUserId } from '@/features/auth/server';
import { IDLE_STATE } from '@/shared/lib';
import { createUserFixtures } from '@/test/fixtures';
import { summarizePeriod } from '../domain';
import { listCards } from '../infra/accounts';
import { createAccount, createInstitution } from '../infra/accounts';
import { listTransactions } from '../infra/ledger';
import { createCardAction, createTransactionAction } from './actions';

vi.mock('@/features/auth/server', () => ({ requireUserId: vi.fn() }));
vi.mock('next/cache', () => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

const mockedRequireUserId = vi.mocked(requireUserId);
const fixtures = createUserFixtures();
afterAll(() => fixtures.cleanup());

function cardForm(extra?: Record<string, string>) {
  const form = new FormData();
  form.set('nickname', 'Dia a dia');
  form.set('institutionId', '');
  form.set('newInstitutionName', `Bank ${crypto.randomUUID().slice(0, 6)}`);
  form.set('brand', '');
  form.set('last4', '1234');
  form.set('creditLimit', '');
  form.set('closingDay', '3');
  form.set('dueDay', '10');
  form.set('currency', 'BRL');
  for (const [key, value] of Object.entries(extra ?? {})) form.set(key, value);
  return form;
}

describe('finance actions', () => {
  it('ignores a client userId and refuses a CVV', async () => {
    const owner = await fixtures.createUser();
    const other = await fixtures.createUser();
    mockedRequireUserId.mockResolvedValue(owner);

    await expect(
      createCardAction(IDLE_STATE, cardForm({ userId: other })),
    ).rejects.toThrow('NEXT_REDIRECT:/app/finance/accounts#cartoes');
    const ownerCards = await listCards(owner);
    const otherCards = await listCards(other);
    expect(ownerCards.active).toHaveLength(1);
    expect(ownerCards.active[0]?.last4).toBe('1234');
    expect(otherCards.active).toHaveLength(0);

    const refused = await createCardAction(IDLE_STATE, cardForm({ cvv: '123' }));
    expect(refused).toEqual({
      status: 'error',
      message: 'Não guarde número completo, CVV ou senha.',
    });
    expect((await listCards(owner)).active).toHaveLength(1);
  });

  it('keeps an invoice payment out of spending', async () => {
    const userId = await fixtures.createUser();
    mockedRequireUserId.mockResolvedValue(userId);
    const institution = await createInstitution(userId, {
      name: `Pay ${crypto.randomUUID().slice(0, 6)}`,
      type: 'bank',
    });
    if (!institution.ok) throw new Error('institution');
    const account = await createAccount(userId, {
      name: 'Conta',
      institutionId: institution.item.id,
      newInstitutionName: null,
      accountType: 'checking',
      currency: 'BRL',
      openingBalance: 0n,
    });
    if (!account.ok) throw new Error('account');
    const form = new FormData();
    form.set('description', 'Pagamento da fatura');
    form.set('transactionDate', '2026-04-10');
    form.set('postedDate', '');
    form.set('amount', '200,00');
    form.set('type', 'invoice_payment');
    form.set('direction', 'outflow');
    form.set('accountId', account.item.id);
    form.set('creditCardId', '');
    form.set('categoryId', '');
    form.set('installmentNumber', '');
    form.set('installmentTotal', '');
    form.set('notes', '');
    form.set('statementId', '');
    await expect(createTransactionAction(IDLE_STATE, form)).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    const rows = await listTransactions(userId);
    const summary = summarizePeriod(
      rows.map((row) => ({
        amountMinor: row.amountMinor,
        currency: 'BRL',
        type: row.type as 'invoice_payment',
        direction: 'outflow',
        categoryName: null,
        accountId: row.accountId,
        creditCardId: null,
      })),
      'BRL',
    );
    expect(summary.expenseMinor).toBe(0n);
    expect(summary.incomeMinor).toBe(0n);
    expect(rows[0]?.type).toBe('invoice_payment');
  });
});
