import { z } from 'zod';
import { formText, optionalFormText } from '@/shared/lib/validation';
import { isCurrency, parseAmountToMinor, type Currency } from './money';

export const INSTITUTION_TYPES = ['bank', 'broker', 'other'] as const;
export const ACCOUNT_TYPES = [
  'checking',
  'savings',
  'wallet',
  'payment',
  'other',
] as const;
export const TRANSACTION_TYPES = [
  'expense',
  'income',
  'refund',
  'invoice_payment',
  'transfer',
] as const;
export const DIRECTIONS = ['outflow', 'inflow'] as const;
export const ASSET_CLASSES = [
  'stock',
  'reit',
  'etf',
  'fixed_income',
  'fund',
  'crypto',
  'other',
] as const;

export type InstitutionType = (typeof INSTITUTION_TYPES)[number];
export type AccountType = (typeof ACCOUNT_TYPES)[number];
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type Direction = (typeof DIRECTIONS)[number];
export type AssetClass = (typeof ASSET_CLASSES)[number];

const SECRET_MESSAGE = 'Não guarde número completo, CVV ou senha.';

function strict<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).strict();
}

const currencyField = formText.pipe(
  z.string().refine(isCurrency, 'Escolha BRL, USD ou EUR.'),
);

const dayField = z.coerce
  .number()
  .int()
  .min(1, 'Use um dia entre 1 e 31.')
  .max(31, 'Use um dia entre 1 e 31.');

function moneyField(allowNegative: boolean, allowZero: boolean) {
  return formText.transform((value, ctx) => {
    const minor = parseAmountToMinor(value);
    if (minor === null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe um valor com no máximo duas casas.',
      });
      return z.NEVER;
    }
    if (!allowNegative && minor < 0n) {
      ctx.addIssue({ code: 'custom', message: 'Use um valor positivo.' });
      return z.NEVER;
    }
    if (!allowZero && minor === 0n) {
      ctx.addIssue({ code: 'custom', message: 'Informe um valor maior que zero.' });
      return z.NEVER;
    }
    return minor;
  });
}

const optionalMoney = optionalFormText.transform((value, ctx) => {
  if (value === null) return null;
  const minor = parseAmountToMinor(value);
  if (minor === null || minor < 0n) {
    ctx.addIssue({
      code: 'custom',
      message: 'Informe um valor com no máximo duas casas.',
    });
    return z.NEVER;
  }
  return minor;
});

const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida.')
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toISOString().slice(0, 10) === value;
  }, 'Informe uma data válida.');

const optionalDate = optionalFormText.pipe(calendarDate.nullable());

const nameField = (max: number, empty: string) =>
  formText.pipe(
    z.string().min(1, empty).max(max, `Use até ${max} caracteres.`),
  );

export const institutionInputSchema = strict({
  name: nameField(80, 'Dê um nome à instituição.'),
  type: formText.pipe(
    z.enum(INSTITUTION_TYPES, { error: 'Escolha o tipo da instituição.' }),
  ),
});

function requireInstitution(
  value: { institutionId: string | null; newInstitutionName: string | null },
  ctx: z.RefinementCtx,
) {
  if (!value.institutionId && !value.newInstitutionName) {
    ctx.addIssue({
      code: 'custom',
      message: 'Escolha ou informe uma instituição.',
      path: ['institutionId'],
    });
  }
}

export const accountInputSchema = strict({
  name: nameField(80, 'Dê um nome à conta.'),
  institutionId: optionalFormText,
  newInstitutionName: optionalFormText,
  accountType: formText.pipe(
    z.enum(ACCOUNT_TYPES, { error: 'Escolha o tipo da conta.' }),
  ),
  currency: currencyField,
  openingBalance: formText.transform((value, ctx) => {
    if (value === '') return 0n;
    const minor = parseAmountToMinor(value);
    if (minor === null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe um saldo com no máximo duas casas.',
      });
      return z.NEVER;
    }
    return minor;
  }),
}).superRefine(requireInstitution);

export const cardInputSchema = strict({
  nickname: nameField(80, 'Dê um apelido ao cartão.'),
  institutionId: optionalFormText,
  newInstitutionName: optionalFormText,
  brand: optionalFormText.pipe(z.string().max(40).nullable()),
  last4: optionalFormText.pipe(
    z
      .string()
      .regex(/^\d{4}$/, 'Informe exatamente 4 dígitos.')
      .nullable(),
  ),
  creditLimit: optionalMoney,
  closingDay: dayField,
  dueDay: dayField,
  currency: currencyField,
}).superRefine(requireInstitution);

export const categoryInputSchema = strict({
  name: nameField(40, 'Dê um nome à categoria.'),
  color: optionalFormText,
  icon: optionalFormText,
  parentId: optionalFormText,
});

export const transactionInputSchema = strict({
  description: nameField(200, 'Descreva o lançamento.'),
  transactionDate: formText.pipe(calendarDate),
  postedDate: optionalDate,
  amount: moneyField(false, false),
  type: formText.pipe(
    z.enum(TRANSACTION_TYPES, { error: 'Escolha o tipo do lançamento.' }),
  ),
  direction: formText.pipe(
    z.enum(DIRECTIONS, { error: 'Escolha entrada ou saída.' }),
  ),
  accountId: optionalFormText,
  creditCardId: optionalFormText,
  categoryId: optionalFormText,
  installmentNumber: optionalFormText,
  installmentTotal: optionalFormText,
  notes: optionalFormText.pipe(z.string().max(2000).nullable()),
  statementId: optionalFormText,
}).superRefine((value, ctx) => {
  const hasAccount = value.accountId !== null;
  const hasCard = value.creditCardId !== null;
  if (hasAccount === hasCard) {
    ctx.addIssue({
      code: 'custom',
      message: 'Escolha uma conta ou um cartão.',
      path: ['accountId'],
    });
  }
  const number = value.installmentNumber;
  const total = value.installmentTotal;
  if ((number === null) !== (total === null)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Informe o número e o total da parcela juntos.',
      path: ['installmentNumber'],
    });
  }
  if (number !== null && total !== null) {
    const parsedNumber = Number(number);
    const parsedTotal = Number(total);
    if (
      !Number.isInteger(parsedNumber) ||
      !Number.isInteger(parsedTotal) ||
      parsedTotal < 1 ||
      parsedNumber < 1 ||
      parsedNumber > parsedTotal
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'A parcela precisa estar entre 1 e o total.',
        path: ['installmentNumber'],
      });
    }
  }
  if (value.type === 'expense' && value.direction !== 'outflow') {
    ctx.addIssue({
      code: 'custom',
      message: 'Despesa é uma saída.',
      path: ['direction'],
    });
  }
  if (
    (value.type === 'income' || value.type === 'refund') &&
    value.direction !== 'inflow'
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'Receita e estorno são entradas.',
      path: ['direction'],
    });
  }
});

export const assetInputSchema = strict({
  name: nameField(80, 'Dê um nome ao ativo.'),
  ticker: optionalFormText.pipe(z.string().max(20).nullable()),
  assetClass: formText.pipe(
    z.enum(ASSET_CLASSES, { error: 'Escolha a classe do ativo.' }),
  ),
  institutionId: optionalFormText,
  newInstitutionName: optionalFormText,
  currency: currencyField,
}).superRefine(requireInstitution);

const quantityField = formText.transform((value, ctx) => {
  if (!/^\d+(\.\d{1,8})?$/.test(value)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Informe uma quantidade com até 8 casas.',
    });
    return z.NEVER;
  }
  return value;
});

export const investmentOperationInputSchema = strict({
  operationType: formText.pipe(
    z.enum(['buy', 'sell', 'income', 'adjustment'], {
      error: 'Escolha a operação.',
    }),
  ),
  operationDate: formText.pipe(calendarDate),
  quantity: quantityField,
  unitPrice: moneyField(false, true),
  fees: formText.transform((value, ctx) => {
    if (value === '') return 0n;
    const minor = parseAmountToMinor(value);
    if (minor === null || minor < 0n) {
      ctx.addIssue({ code: 'custom', message: 'Informe uma taxa válida.' });
      return z.NEVER;
    }
    return minor;
  }),
  notes: optionalFormText.pipe(z.string().max(2000).nullable()),
}).superRefine((value, ctx) => {
  if (value.operationType !== 'adjustment' && value.quantity === '0') {
    ctx.addIssue({
      code: 'custom',
      message: 'Informe uma quantidade maior que zero.',
      path: ['quantity'],
    });
  }
});

export const valuationInputSchema = strict({
  valuationDate: formText.pipe(calendarDate),
  unitValue: optionalMoney,
  totalValue: optionalMoney,
}).superRefine((value, ctx) => {
  const hasUnit = value.unitValue !== null;
  const hasTotal = value.totalValue !== null;
  if (hasUnit === hasTotal) {
    ctx.addIssue({
      code: 'custom',
      message: 'Informe o valor unitário ou o valor total.',
      path: ['unitValue'],
    });
  }
});

export const statementInputSchema = strict({
  accountId: optionalFormText,
  creditCardId: optionalFormText,
  referenceMonth: formText.pipe(
    z.string().regex(/^\d{4}-\d{2}$/, 'Informe o mês de referência.'),
  ),
  periodStart: formText.pipe(calendarDate),
  periodEnd: formText.pipe(calendarDate),
  dueDate: optionalDate,
  declaredTotal: optionalMoney,
}).superRefine((value, ctx) => {
  if ((value.accountId === null) === (value.creditCardId === null)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Escolha uma conta ou um cartão.',
      path: ['accountId'],
    });
  }
  if (value.periodStart > value.periodEnd) {
    ctx.addIssue({
      code: 'custom',
      message: 'O início do período não pode ser depois do fim.',
      path: ['periodEnd'],
    });
  }
});

export type InstitutionInput = z.output<typeof institutionInputSchema>;
export type AccountInput = z.output<typeof accountInputSchema>;
export type CardInput = z.output<typeof cardInputSchema>;
export type CategoryInput = z.output<typeof categoryInputSchema>;
export type TransactionInput = z.output<typeof transactionInputSchema>;
export type AssetInput = z.output<typeof assetInputSchema>;
export type InvestmentOperationInput = z.output<
  typeof investmentOperationInputSchema
>;
export type ValuationInput = z.output<typeof valuationInputSchema>;
export type StatementInput = z.output<typeof statementInputSchema>;

export function defaultDirection(
  type: TransactionType,
  instrument: 'account' | 'card',
): Direction {
  if (type === 'expense') return 'outflow';
  if (type === 'income' || type === 'refund') return 'inflow';
  if (type === 'invoice_payment') {
    return instrument === 'card' ? 'inflow' : 'outflow';
  }
  return 'outflow';
}

export function currencyOf(value: string): Currency {
  if (!isCurrency(value)) throw new Error('Unsupported currency');
  return value;
}

export const SECRET_FIELDS = [
  'pan',
  'cardNumber',
  'cvv',
  'cvc',
  'password',
  'pin',
  'userId',
] as const;

export { SECRET_MESSAGE };
