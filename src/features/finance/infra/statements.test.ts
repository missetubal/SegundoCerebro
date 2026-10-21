import { eq } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import { db, importBatches, transactions } from '@/shared/db';
import { createUserFixtures } from '@/test/fixtures';
import { createCard, createInstitution } from './accounts';
import { createMemoryBlobStore } from './blob-store';
import {
  createStatement,
  deleteAttachment,
  deleteAttachmentAndImported,
  getStatement,
  replaceAttachment,
} from './statements';

const fixtures = createUserFixtures();
afterAll(() => fixtures.cleanup());

const pdf = new TextEncoder().encode('%PDF-1.7\n');

async function seedCard(userId: string) {
  const institution = await createInstitution(userId, {
    name: `Stmt ${crypto.randomUUID().slice(0, 6)}`,
    type: 'bank',
  });
  if (!institution.ok) throw new Error('institution');
  const card = await createCard(userId, {
    nickname: 'Dia a dia',
    institutionId: institution.item.id,
    newInstitutionName: null,
    brand: null,
    last4: '1234',
    creditLimit: null,
    closingDay: 3,
    dueDay: 10,
    currency: 'BRL',
  });
  if (!card.ok) throw new Error('card');
  return card.item;
}

async function seedStatement(userId: string, cardId: string, month: string) {
  const store = createMemoryBlobStore();
  const created = await createStatement(
    userId,
    {
      accountId: null,
      creditCardId: cardId,
      referenceMonth: month,
      periodStart: '2026-03-04',
      periodEnd: '2026-04-03',
      dueDate: '2026-04-10',
      declaredTotal: 25000n,
    },
    { name: 'fatura.pdf', type: 'application/pdf', bytes: pdf },
    store,
  );
  if (!created.ok) throw new Error('statement');
  return { store, statement: created.item };
}

describe('statements', () => {
  it('keeps transactions when only the file is deleted and hides the storage key', async () => {
    const userId = await fixtures.createUser();
    const card = await seedCard(userId);
    const { store, statement } = await seedStatement(userId, card.id, '2026-04');
    expect(statement).not.toHaveProperty('storageKey');
    const [batch] = await db
      .insert(importBatches)
      .values({
        userId,
        statementId: statement.id,
        sourceFormat: 'csv',
        status: 'confirmed',
      })
      .returning();
    await db.insert(transactions).values([
      tx(userId, card.id, statement.id, 'Importado', batch.id),
      tx(userId, card.id, statement.id, 'Manual', null),
    ]);
    expect(await deleteAttachment(userId, statement.id, store)).toBe(true);
    expect((await getStatement(userId, statement.id))?.fileName).toBeNull();
    const rows = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId));
    expect(rows.map((row) => row.description).sort()).toEqual(['Importado', 'Manual']);
  });

  it('removes only imported transactions after an explicit confirmation', async () => {
    const userId = await fixtures.createUser();
    const card = await seedCard(userId);
    const { store, statement } = await seedStatement(userId, card.id, '2026-05');
    const [batch] = await db
      .insert(importBatches)
      .values({
        userId,
        statementId: statement.id,
        sourceFormat: 'ofx',
        status: 'confirmed',
      })
      .returning();
    await db.insert(transactions).values([
      tx(userId, card.id, statement.id, 'Importado', batch.id),
      tx(userId, card.id, statement.id, 'Manual', null),
    ]);
    expect(await deleteAttachmentAndImported(userId, statement.id, store)).toBe(true);
    const rows = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId));
    expect(rows.map((row) => row.description)).toEqual(['Manual']);
  });

  it('replaces the file and keeps the statement', async () => {
    const userId = await fixtures.createUser();
    const card = await seedCard(userId);
    const { store, statement } = await seedStatement(userId, card.id, '2026-06');
    const replaced = await replaceAttachment(
      userId,
      statement.id,
      {
        name: 'nova.csv',
        type: 'text/csv',
        bytes: new TextEncoder().encode('data,valor\n2026-04-01,10\n'),
      },
      store,
    );
    expect(replaced).toBe(true);
    expect((await getStatement(userId, statement.id))?.fileName).toBe('nova.csv');
    expect(store).toBeDefined();
  });
});

function tx(
  userId: string,
  cardId: string,
  statementId: string,
  description: string,
  importBatchId: string | null,
) {
  return {
    userId,
    creditCardId: cardId,
    statementId,
    importBatchId,
    transactionDate: '2026-04-02',
    description,
    amountMinor: 1000n,
    currency: 'BRL',
    direction: 'outflow' as const,
    type: 'expense' as const,
    dedupeHash: `${description}-${importBatchId ?? 'manual'}`,
  };
}
