import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { requireUserId } from '@/features/auth/server';
import { createArea, getArea, listAreas, type Area } from '../infra';
import { IDLE_STATE } from '@/shared/lib';
import { createUserFixtures } from '@/test/fixtures';
import {
  archiveAreaAction,
  createAreaAction,
  deleteAreaAction,
  moveAreaAction,
  unarchiveAreaAction,
  updateAreaAction,
} from './actions';

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

function signInAs(userId: string) {
  mockedRequireUserId.mockResolvedValue(userId);
}

function formWith(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

async function seedArea(userId: string, name: string): Promise<Area> {
  const result = await createArea(userId, {
    name,
    description: null,
    color: null,
    icon: null,
  });
  if (!result.ok) throw new Error('setup failed');
  return result.item;
}

beforeEach(() => {
  mockedRequireUserId.mockReset();
  mockedRequireUserId.mockResolvedValue('__unset__');
});

describe('createAreaAction', () => {
  it('creates the area for the session user and redirects to it', async () => {
    const userId = await fixtures.createUser();
    signInAs(userId);

    await expect(
      createAreaAction(
        IDLE_STATE,
        formWith({ name: 'Carreira', color: 'blue', icon: 'briefcase' }),
      ),
    ).rejects.toThrow(/^NEXT_REDIRECT:\/app\/areas\/.+/);

    const [area] = (await listAreas(userId)).active;
    expect(area).toMatchObject({ name: 'Carreira', color: 'blue', icon: 'briefcase' });
  });

  it('returns a neutral message for invalid input without writing', async () => {
    const userId = await fixtures.createUser();
    signInAs(userId);

    const state = await createAreaAction(IDLE_STATE, formWith({ name: '  ' }));

    expect(state).toEqual({ status: 'error', message: 'Dê um nome à área.' });
    expect((await listAreas(userId)).active).toEqual([]);
  });

  it('explains duplicate names', async () => {
    const userId = await fixtures.createUser();
    await seedArea(userId, 'Saúde');
    signInAs(userId);

    const state = await createAreaAction(IDLE_STATE, formWith({ name: 'saúde' }));

    expect(state.status === 'error' && state.message).toMatch(/Já existe uma área/);
  });

  it('ignores a userId sent by the client', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    signInAs(userA);

    await expect(
      createAreaAction(IDLE_STATE, formWith({ name: 'Lazer', userId: userB })),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect((await listAreas(userA)).active).toHaveLength(1);
    expect((await listAreas(userB)).active).toEqual([]);
  });

  it('redirects to sign in without a session', async () => {
    mockedRequireUserId.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT:/signin');
    });

    const result = createAreaAction(IDLE_STATE, formWith({ name: 'Lazer' }));
    await expect(result).rejects.toThrow('NEXT_REDIRECT:/signin');
  });
});

describe('updateAreaAction', () => {
  it('updates the area and redirects to its detail', async () => {
    const userId = await fixtures.createUser();
    const area = await seedArea(userId, 'Saúde');
    signInAs(userId);

    await expect(
      updateAreaAction(
        IDLE_STATE,
        formWith({ id: area.id, name: 'Saúde e corpo', color: 'emerald' }),
      ),
    ).rejects.toThrow(`NEXT_REDIRECT:/app/areas/${area.id}`);

    expect(await getArea(userId, area.id)).toMatchObject({
      name: 'Saúde e corpo',
      color: 'emerald',
    });
  });
});

describe('item actions', () => {
  it('archives, unarchives and moves areas of the session user', async () => {
    const userId = await fixtures.createUser();
    await seedArea(userId, 'Carreira');
    const saude = await seedArea(userId, 'Saúde');
    signInAs(userId);

    expect(
      await moveAreaAction(IDLE_STATE, formWith({ id: saude.id, direction: 'up' })),
    ).toEqual({ status: 'success' });
    expect((await listAreas(userId)).active.map((p) => p.name)).toEqual([
      'Saúde',
      'Carreira',
    ]);

    await archiveAreaAction(IDLE_STATE, formWith({ id: saude.id }));
    expect((await getArea(userId, saude.id))?.archivedAt).not.toBeNull();

    await unarchiveAreaAction(IDLE_STATE, formWith({ id: saude.id }));
    expect((await getArea(userId, saude.id))?.archivedAt).toBeNull();
  });

  it('rejects an unknown move direction', async () => {
    const userId = await fixtures.createUser();
    const area = await seedArea(userId, 'Carreira');
    signInAs(userId);

    const state = await moveAreaAction(
      IDLE_STATE,
      formWith({ id: area.id, direction: 'sideways' }),
    );

    expect(state).toEqual({ status: 'error', message: 'Item não encontrado.' });
  });

  it('deletes the area and redirects to the list', async () => {
    const userId = await fixtures.createUser();
    const area = await seedArea(userId, 'Lazer');
    signInAs(userId);

    await expect(
      deleteAreaAction(IDLE_STATE, formWith({ id: area.id })),
    ).rejects.toThrow('NEXT_REDIRECT:/app/areas');

    expect(await getArea(userId, area.id)).toBeNull();
  });
});

describe('isolation between users', () => {
  it('never changes a area of another user', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    const areaB = await seedArea(userB, 'Finanças');
    signInAs(userA);
    const notFound = { status: 'error', message: 'Item não encontrado.' };

    expect(
      await updateAreaAction(IDLE_STATE, formWith({ id: areaB.id, name: 'Hack' })),
    ).toEqual(notFound);
    expect(
      await moveAreaAction(IDLE_STATE, formWith({ id: areaB.id, direction: 'up' })),
    ).toEqual(notFound);
    expect(await archiveAreaAction(IDLE_STATE, formWith({ id: areaB.id }))).toEqual(
      notFound,
    );
    expect(await deleteAreaAction(IDLE_STATE, formWith({ id: areaB.id }))).toEqual(
      notFound,
    );

    expect(await getArea(userB, areaB.id)).toEqual(areaB);
  });
});
