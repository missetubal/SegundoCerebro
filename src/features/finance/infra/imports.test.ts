import { eq } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import { db, transactions } from '@/shared/db';
import { createUserFixtures } from '@/test/fixtures';
import { createAccount, createInstitution } from './accounts';
import { createTransaction as addManual } from './ledger';
import { createMemoryBlobStore } from './blob-store';
import { createStatement } from './statements';
import {
  confirmImport,
  previewReconciliation,
  startPreview,
  undoImport,
  type ImportLine,
} from './imports';
import { MAX_INCLUDED_ROWS } from '../domain';

const fixtures = createUserFixtures();
afterAll(() => fixtures.cleanup());

const csv = new TextEncoder().encode(
  'data;descricao;valor\n02/04/2026;Padaria;-18,90\n03/04/2026;Uber;-20,00\n',
);

async function seed(userId: string) {
  const institution = await createInstitution(userId, {
    name: `Imp ${crypto.randomUUID().slice(0, 6)}`,
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
  const store = createMemoryBlobStore();
  const statement = await createStatement(
    userId,
    {
      accountId: account.item.id,
      creditCardId: null,
      referenceMonth: '2026-04',
      periodStart: '2026-04-01',
      periodEnd: '2026-04-30',
      dueDate: null,
      declaredTotal: 10000n,
    },
    { name: 'extrato.csv', type: 'text/csv', bytes: csv },
    store,
  );
  if (!statement.ok) throw new Error('statement');
  return { account: account.item, statement: statement.item, store };
}

describe('imports', () => {
  it('does not save transactions before confirm and asks for a mapping every time', async () => {
    const userId = await fixtures.createUser();
    const { statement, store } = await seed(userId);
    const first = await startPreview(userId, statement.id, null, store);
    const second = await startPreview(userId, statement.id, null, store);
    expect(first).toEqual({ ok: false, reason: 'mapping_required' });
    expect(second).toEqual({ ok: false, reason: 'mapping_required' });
    const rows = await db.select().from(transactions).where(eq(transactions.userId, userId));
    expect(rows).toHaveLength(0);
  });

  it('confirms included lines, keeps a duplicate, and undo leaves the manual one', async () => {
    const userId = await fixtures.createUser();
    const { account, statement, store } = await seed(userId);
    await addManual(userId, {
      description: 'Padaria',
      transactionDate: '2026-04-02',
      postedDate: null,
      amount: 1890n,
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
    const preview = await startPreview(
      userId,
      statement.id,
      {
        dateColumn: 'data',
        descriptionColumn: 'descricao',
        amountColumn: 'valor',
      },
      store,
    );
    expect(preview.ok).toBe(true);
    if (!preview.ok) return;
    expect(preview.lines.some((line) => line.duplicate)).toBe(true);
    const edited = preview.lines.map((line) =>
      line.description === 'Uber' ? { ...line, included: false } : line,
    );
    const check = previewReconciliation(edited, 10000n);
    expect(check.checkedMinor).toBe(1890n);
    expect(check.differenceMinor).toBe(8110n);
    const saved = await confirmImport(userId, preview.batchId, edited);
    expect(saved).toEqual({ ok: true, item: { imported: 1 } });
    const after = await db.select().from(transactions).where(eq(transactions.userId, userId));
    expect(after.filter((row) => row.description === 'Padaria')).toHaveLength(2);
    const undone = await undoImport(userId, preview.batchId);
    expect(undone.ok).toBe(true);
    const left = await db.select().from(transactions).where(eq(transactions.userId, userId));
    expect(left.map((row) => row.description)).toEqual(['Padaria']);
    expect(left[0]?.importBatchId).toBeNull();
  });

  it('refuses more than 2000 included lines without writing', async () => {
    const userId = await fixtures.createUser();
    const { statement, store } = await seed(userId);
    const preview = await startPreview(
      userId,
      statement.id,
      {
        dateColumn: 'data',
        descriptionColumn: 'descricao',
        amountColumn: 'valor',
      },
      store,
    );
    if (!preview.ok) throw new Error('preview');
    const flood = Array.from({ length: MAX_INCLUDED_ROWS + 1 }, () => ({
      ...preview.lines[0],
      included: true,
    }));
    const saved = await confirmImport(userId, preview.batchId, flood);
    expect(saved.ok).toBe(false);
    const rows = await db.select().from(transactions).where(eq(transactions.userId, userId));
    expect(rows).toHaveLength(0);
  });

  it('leaves an invoice payment out of the checked sum', () => {
    const lines: ImportLine[] = [
      line('expense', 8000n),
      line('invoice_payment', 8000n),
    ];
    const result = previewReconciliation(lines, 8000n);
    expect(result.checkedMinor).toBe(8000n);
    expect(result.paymentMinor).toBe(8000n);
    expect(result.differenceMinor).toBe(0n);
  });
});

function line(type: ImportLine['type'], amountMinor: bigint): ImportLine {
  return {
    transactionDate: '2026-04-02',
    postedDate: null,
    description: type,
    amountMinor,
    type,
    direction: type === 'expense' ? 'outflow' : 'outflow',
    externalId: null,
    incompatibleCurrency: false,
    duplicate: false,
    included: true,
    categoryId: null,
  };
}
