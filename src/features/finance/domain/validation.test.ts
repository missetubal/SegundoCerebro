import { describe, expect, it } from 'vitest';
import {
  accountInputSchema,
  cardInputSchema,
  categoryInputSchema,
  institutionInputSchema,
  transactionInputSchema,
} from './validation';

const card = {
  nickname: 'Dia a dia',
  institutionId: 'inst-1',
  newInstitutionName: '',
  brand: '',
  last4: '1234',
  creditLimit: '',
  closingDay: '3',
  dueDay: '10',
  currency: 'BRL',
};

describe('finance validation', () => {
  it('rejects card secrets and a foreign user id without a partial success', () => {
    for (const field of ['pan', 'cardNumber', 'cvv', 'cvc', 'password', 'pin', 'userId']) {
      const result = cardInputSchema.safeParse({ ...card, [field]: '4111' });
      expect(result.success).toBe(false);
    }
  });

  it('rejects last4 that is not four digits and an unknown currency', () => {
    expect(cardInputSchema.safeParse({ ...card, last4: '12' }).success).toBe(false);
    expect(cardInputSchema.safeParse({ ...card, currency: 'GBP' }).success).toBe(false);
  });

  it('rejects an incomplete installment pair', () => {
    const result = transactionInputSchema.safeParse({
      description: 'Mercado',
      transactionDate: '2026-04-05',
      postedDate: '',
      amount: '32,50',
      type: 'expense',
      direction: 'outflow',
      accountId: 'acc-1',
      creditCardId: '',
      categoryId: '',
      installmentNumber: '2',
      installmentTotal: '',
      notes: '',
      statementId: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a minimal institution, account and category', () => {
    expect(
      institutionInputSchema.safeParse({ name: 'Nubank', type: 'bank' }).success,
    ).toBe(true);
    expect(
      accountInputSchema.safeParse({
        name: 'Conta corrente',
        institutionId: 'inst-1',
        newInstitutionName: '',
        accountType: 'checking',
        currency: 'BRL',
        openingBalance: '100,00',
      }).success,
    ).toBe(true);
    expect(categoryInputSchema.safeParse({ name: 'Transporte', color: '', icon: '', parentId: '' }).success).toBe(true);
  });
});
