import { afterAll, describe, expect, it } from 'vitest';
import { createUserFixtures } from '@/test/fixtures';
import {
  createAccount,
  createCard,
  createInstitution,
  deleteAccount,
  listAccountBalances,
  listAccounts,
  updateAccount,
} from './accounts';
import { createTransaction } from './ledger';

const fixtures = createUserFixtures();
afterAll(() => fixtures.cleanup());

async function seedAccount(userId: string, openingBalance = '100,00') {
  const institution = await createInstitution(userId, {
    name: `Bank ${crypto.randomUUID().slice(0, 8)}`,
    type: 'bank',
  });
  if (!institution.ok) throw new Error('institution');
  const account = await createAccount(userId, {
    name: 'Conta corrente',
    institutionId: institution.item.id,
    newInstitutionName: null,
    accountType: 'checking',
    currency: 'BRL',
    openingBalance: 10000n,
  });
  if (!account.ok) throw new Error('account');
  void openingBalance;
  return { institutionId: institution.item.id, account: account.item };
}

describe('finance accounts', () => {
  it('reduces the balance after an expense and refuses to delete the account', async () => {
    const userId = await fixtures.createUser();
    const { account } = await seedAccount(userId);
    const expense = await createTransaction(userId, {
      description: 'Mercado',
      transactionDate: '2026-04-05',
      postedDate: null,
      amount: 4000n,
      type: 'expense',
      direction: 'outflow',
      accountId: account.id,
      creditCardId: null,
      categoryId: null,
      installmentNumber: null,
      installmentTotal: null,
      notes: null,
      statementId: null,
    });
    expect(expense.ok).toBe(true);
    const balances = await listAccountBalances(userId);
    expect(balances.find((row) => row.id === account.id)?.balanceMinor).toBe(6000n);
    const deleted = await deleteAccount(userId, account.id);
    expect(deleted).toEqual({ ok: false, reason: 'has_children' });
    const remaining = await listAccounts(userId);
    expect(remaining.active.some((row) => row.id === account.id)).toBe(true);
  });

  it('locks currency after a transaction and isolates users', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    const { account } = await seedAccount(userA);
    await createTransaction(userA, {
      description: 'Cafe',
      transactionDate: '2026-04-01',
      postedDate: null,
      amount: 100n,
      type: 'expense',
      direction: 'outflow',
      accountId: account.id,
      creditCardId: null,
      categoryId: null,
      installmentNumber: null,
      installmentTotal: null,
      notes: null,
      statementId: null,
    });
    const locked = await updateAccount(userA, account.id, {
      name: account.name,
      institutionId: account.institutionId,
      newInstitutionName: null,
      accountType: 'checking',
      currency: 'USD',
      openingBalance: account.openingBalanceMinor,
    });
    expect(locked).toEqual({ ok: false, reason: 'currency_locked' });

    const card = await createCard(userB, {
      nickname: 'Dia a dia',
      institutionId: null,
      newInstitutionName: `Card bank ${crypto.randomUUID().slice(0, 6)}`,
      brand: null,
      last4: '1234',
      creditLimit: null,
      closingDay: 3,
      dueDay: 10,
      currency: 'BRL',
    });
    expect(card.ok).toBe(true);
    const seenByA = await listAccounts(userA);
    expect(seenByA.active.some((row) => row.userId === userB)).toBe(false);
    const stolen = await updateAccount(userB, account.id, {
      name: 'Roubada',
      institutionId: account.institutionId,
      newInstitutionName: null,
      accountType: 'checking',
      currency: 'BRL',
      openingBalance: 0n,
    });
    expect(stolen).toEqual({ ok: false, reason: 'not_found' });
  });
});
