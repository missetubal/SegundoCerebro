import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { auth } from '@/features/auth/server';
import { GET as exportFinanceRoute } from '@/app/app/finance/export/route';
import { GET as statementFileRoute } from '@/app/app/finance/statements/[id]/file/route';
import { createUserFixtures } from '@/test/fixtures';
import { createAccount, createCard, createInstitution } from '../infra/accounts';
import { createMemoryBlobStore } from '../infra/blob-store';
import { createStatement } from '../infra/statements';

vi.mock('@/features/auth/server', () => ({
  auth: vi.fn(),
  requireUserId: vi.fn(),
}));

const mockedAuth = vi.mocked(auth as () => Promise<{ user?: { id?: string } } | null>);
const fixtures = createUserFixtures();
afterAll(() => fixtures.cleanup());

beforeEach(() => {
  mockedAuth.mockReset();
});

describe('finance routes', () => {
  it('does not download a statement without a session or for another user', async () => {
    const owner = await fixtures.createUser();
    const other = await fixtures.createUser();
    const institution = await createInstitution(owner, {
      name: `File ${crypto.randomUUID().slice(0, 6)}`,
      type: 'bank',
    });
    if (!institution.ok) throw new Error('institution');
    const card = await createCard(owner, {
      nickname: 'Cartão',
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
    const statement = await createStatement(
      owner,
      {
        accountId: null,
        creditCardId: card.item.id,
        referenceMonth: '2026-04',
        periodStart: '2026-03-04',
        periodEnd: '2026-04-03',
        dueDate: null,
        declaredTotal: null,
      },
      {
        name: 'fatura.pdf',
        type: 'application/pdf',
        bytes: new TextEncoder().encode('%PDF-1.7\n'),
      },
      createMemoryBlobStore(),
    );
    if (!statement.ok) throw new Error('statement');
    mockedAuth.mockResolvedValue(null);
    const anonymous = await statementFileRoute(new Request('http://localhost'), {
      params: Promise.resolve({ id: statement.item.id }),
    });
    expect(anonymous.status).toBe(401);
    mockedAuth.mockResolvedValue({ user: { id: other } });
    const stolen = await statementFileRoute(new Request('http://localhost'), {
      params: Promise.resolve({ id: statement.item.id }),
    });
    expect(stolen.status).toBe(404);
  });

  it('exports only the signed-in user and omits secrets', async () => {
    const owner = await fixtures.createUser();
    const other = await fixtures.createUser();
    const ownerName = `Conta ${crypto.randomUUID()}`;
    const otherName = `Alheia ${crypto.randomUUID()}`;
    const ownerInstitution = await createInstitution(owner, {
      name: `Bank ${crypto.randomUUID().slice(0, 6)}`,
      type: 'bank',
    });
    const otherInstitution = await createInstitution(other, {
      name: `Bank ${crypto.randomUUID().slice(0, 6)}`,
      type: 'bank',
    });
    if (!ownerInstitution.ok || !otherInstitution.ok) throw new Error('institution');
    await createAccount(owner, {
      name: ownerName,
      institutionId: ownerInstitution.item.id,
      newInstitutionName: null,
      accountType: 'checking',
      currency: 'BRL',
      openingBalance: 0n,
    });
    await createAccount(other, {
      name: otherName,
      institutionId: otherInstitution.item.id,
      newInstitutionName: null,
      accountType: 'checking',
      currency: 'BRL',
      openingBalance: 0n,
    });
    await createCard(owner, {
      nickname: 'Cartão',
      institutionId: ownerInstitution.item.id,
      newInstitutionName: null,
      brand: null,
      last4: '4321',
      creditLimit: null,
      closingDay: 1,
      dueDay: 10,
      currency: 'BRL',
    });
    mockedAuth.mockResolvedValue(null);
    expect((await exportFinanceRoute()).status).toBe(401);
    mockedAuth.mockResolvedValue({ user: { id: owner } });
    const response = await exportFinanceRoute();
    const body = await response.text();
    const data = JSON.parse(body) as {
      version: number;
      accounts: Array<{ name: string }>;
      cards: Array<{ last4: string }>;
    };
    expect(data.version).toBe(1);
    expect(data.accounts.map((account) => account.name)).toContain(ownerName);
    expect(body).not.toContain(otherName);
    expect(body).not.toContain(`${owner}@test.local`);
    expect(body).not.toContain('storageKey');
    expect(body).not.toContain('draftRows');
    expect(data.cards[0]?.last4).toBe('4321');
    expect(body).not.toContain('pan');
  });
});
