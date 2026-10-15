import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { auth } from '@/auth';
import { createPillar, getPillar, listPillars, type Pillar } from '@/db/pillars';
import { IDLE_STATE } from '@/lib/action-state';
import { createUserFixtures } from '@/test/fixtures';
import {
  archivePillarAction,
  createPillarAction,
  deletePillarAction,
  movePillarAction,
  unarchivePillarAction,
  updatePillarAction,
} from './actions';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

const mockedAuth = vi.mocked(auth as () => Promise<unknown>);
const fixtures = createUserFixtures();
afterAll(() => fixtures.cleanup());

function signInAs(userId: string) {
  mockedAuth.mockResolvedValue({ user: { id: userId } });
}

function formWith(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

async function seedPillar(userId: string, name: string): Promise<Pillar> {
  const result = await createPillar(userId, {
    name,
    description: null,
    color: null,
    icon: null,
  });
  if (!result.ok) throw new Error('setup failed');
  return result.pillar;
}

beforeEach(() => mockedAuth.mockReset());

describe('createPillarAction', () => {
  it('creates the pillar for the session user and redirects to it', async () => {
    const userId = await fixtures.createUser();
    signInAs(userId);

    await expect(
      createPillarAction(
        IDLE_STATE,
        formWith({ name: 'Carreira', color: 'blue', icon: 'briefcase' }),
      ),
    ).rejects.toThrow(/^NEXT_REDIRECT:\/app\/pillars\/.+/);

    const [pillar] = (await listPillars(userId)).active;
    expect(pillar).toMatchObject({ name: 'Carreira', color: 'blue', icon: 'briefcase' });
  });

  it('returns a neutral message for invalid input without writing', async () => {
    const userId = await fixtures.createUser();
    signInAs(userId);

    const state = await createPillarAction(IDLE_STATE, formWith({ name: '  ' }));

    expect(state).toEqual({ status: 'error', message: 'Dê um nome ao pilar.' });
    expect((await listPillars(userId)).active).toEqual([]);
  });

  it('explains duplicate names', async () => {
    const userId = await fixtures.createUser();
    await seedPillar(userId, 'Saúde');
    signInAs(userId);

    const state = await createPillarAction(IDLE_STATE, formWith({ name: 'saúde' }));

    expect(state.status === 'error' && state.message).toMatch(/Já existe um pilar/);
  });

  it('ignores a userId sent by the client', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    signInAs(userA);

    await expect(
      createPillarAction(IDLE_STATE, formWith({ name: 'Lazer', userId: userB })),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect((await listPillars(userA)).active).toHaveLength(1);
    expect((await listPillars(userB)).active).toEqual([]);
  });

  it('redirects to sign in without a session', async () => {
    mockedAuth.mockResolvedValue(null);

    await expect(
      createPillarAction(IDLE_STATE, formWith({ name: 'Lazer' })),
    ).rejects.toThrow('NEXT_REDIRECT:/signin');
  });
});

describe('updatePillarAction', () => {
  it('updates the pillar and redirects to its detail', async () => {
    const userId = await fixtures.createUser();
    const pillar = await seedPillar(userId, 'Saúde');
    signInAs(userId);

    await expect(
      updatePillarAction(
        IDLE_STATE,
        formWith({ id: pillar.id, name: 'Saúde e corpo', color: 'emerald' }),
      ),
    ).rejects.toThrow(`NEXT_REDIRECT:/app/pillars/${pillar.id}`);

    expect(await getPillar(userId, pillar.id)).toMatchObject({
      name: 'Saúde e corpo',
      color: 'emerald',
    });
  });
});

describe('item actions', () => {
  it('archives, unarchives and moves pillars of the session user', async () => {
    const userId = await fixtures.createUser();
    await seedPillar(userId, 'Carreira');
    const saude = await seedPillar(userId, 'Saúde');
    signInAs(userId);

    expect(
      await movePillarAction(IDLE_STATE, formWith({ id: saude.id, direction: 'up' })),
    ).toEqual({ status: 'success' });
    expect((await listPillars(userId)).active.map((p) => p.name)).toEqual([
      'Saúde',
      'Carreira',
    ]);

    await archivePillarAction(IDLE_STATE, formWith({ id: saude.id }));
    expect((await getPillar(userId, saude.id))?.archivedAt).not.toBeNull();

    await unarchivePillarAction(IDLE_STATE, formWith({ id: saude.id }));
    expect((await getPillar(userId, saude.id))?.archivedAt).toBeNull();
  });

  it('rejects an unknown move direction', async () => {
    const userId = await fixtures.createUser();
    const pillar = await seedPillar(userId, 'Carreira');
    signInAs(userId);

    const state = await movePillarAction(
      IDLE_STATE,
      formWith({ id: pillar.id, direction: 'sideways' }),
    );

    expect(state).toEqual({ status: 'error', message: 'Item não encontrado.' });
  });

  it('deletes the pillar and redirects to the list', async () => {
    const userId = await fixtures.createUser();
    const pillar = await seedPillar(userId, 'Lazer');
    signInAs(userId);

    await expect(
      deletePillarAction(IDLE_STATE, formWith({ id: pillar.id })),
    ).rejects.toThrow('NEXT_REDIRECT:/app/pillars');

    expect(await getPillar(userId, pillar.id)).toBeNull();
  });
});

describe('isolation between users', () => {
  it('never changes a pillar of another user', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    const pillarB = await seedPillar(userB, 'Finanças');
    signInAs(userA);
    const notFound = { status: 'error', message: 'Item não encontrado.' };

    expect(
      await updatePillarAction(IDLE_STATE, formWith({ id: pillarB.id, name: 'Hack' })),
    ).toEqual(notFound);
    expect(
      await movePillarAction(IDLE_STATE, formWith({ id: pillarB.id, direction: 'up' })),
    ).toEqual(notFound);
    expect(await archivePillarAction(IDLE_STATE, formWith({ id: pillarB.id }))).toEqual(
      notFound,
    );
    expect(await deletePillarAction(IDLE_STATE, formWith({ id: pillarB.id }))).toEqual(
      notFound,
    );

    expect(await getPillar(userB, pillarB.id)).toEqual(pillarB);
  });
});
