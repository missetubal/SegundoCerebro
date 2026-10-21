import { afterAll, describe, expect, it } from 'vitest';
import { createUserFixtures } from '@/test/fixtures';
import { createAccount, createInstitution } from './accounts';
import {
  assignCategory,
  createCategory,
  createTransaction,
  listTransactions,
} from './ledger';

const fixtures = createUserFixtures();
afterAll(() => fixtures.cleanup());

describe('finance ledger', () => {
  it('stores one installment row and assigns a category only to the selected ids', async () => {
    const userId = await fixtures.createUser();
    const otherId = await fixtures.createUser();
    const institution = await createInstitution(userId, {
      name: `Ledger ${crypto.randomUUID().slice(0, 6)}`,
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
    const category = await createCategory(userId, {
      name: `Transporte ${crypto.randomUUID().slice(0, 4)}`,
      color: null,
      icon: null,
      parentId: null,
    });
    if (!category.ok) throw new Error('category');
    const base = {
      transactionDate: '2026-04-05',
      postedDate: null,
      amount: 1000n,
      type: 'expense' as const,
      direction: 'outflow' as const,
      accountId: account.item.id,
      creditCardId: null,
      categoryId: null,
      notes: null,
      statementId: null,
    };
    const first = await createTransaction(userId, {
      ...base,
      description: 'Parcela',
      installmentNumber: '2',
      installmentTotal: '6',
    });
    const second = await createTransaction(userId, {
      ...base,
      description: 'Outra',
      installmentNumber: null,
      installmentTotal: null,
    });
    const third = await createTransaction(userId, {
      ...base,
      description: 'Fica',
      installmentNumber: null,
      installmentTotal: null,
    });
    expect(first.ok && second.ok && third.ok).toBe(true);
    if (!first.ok || !second.ok || !third.ok) return;
    expect(first.item.installmentNumber).toBe(2);
    expect(first.item.installmentTotal).toBe(6);
    const rows = await listTransactions(userId, { query: 'Parcela' });
    expect(rows).toHaveLength(1);

    const otherCategory = await createCategory(otherId, {
      name: 'Alheia',
      color: null,
      icon: null,
      parentId: null,
    });
    if (!otherCategory.ok) throw new Error('other category');
    const rejected = await assignCategory(
      userId,
      [first.item.id, second.item.id, 'missing'],
      category.item.id,
    );
    expect(rejected.ok).toBe(false);
    const applied = await assignCategory(
      userId,
      [first.item.id, second.item.id],
      category.item.id,
    );
    expect(applied).toEqual({ ok: true, item: { count: 2 } });
    const untouched = await listTransactions(userId, { query: 'Fica' });
    expect(untouched[0]?.categoryId).toBeNull();
    const stolen = await assignCategory(otherId, [first.item.id], otherCategory.item.id);
    expect(stolen.ok).toBe(false);
  });
});
