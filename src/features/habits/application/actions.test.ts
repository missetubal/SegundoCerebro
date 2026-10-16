import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { requireUserId } from '@/features/auth/server';
import { createArea } from '@/features/areas/server';
import { IDLE_STATE } from '@/shared/lib';
import { createUserFixtures } from '@/test/fixtures';
import { createHabit, listHabits } from '../infra';
import {
  archiveHabitAction,
  createHabitAction,
  updateHabitAction,
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

function formWith(
  fields: Record<string, string>,
  multi: Record<string, string[]> = {},
) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  for (const [key, values] of Object.entries(multi)) {
    for (const value of values) formData.append(key, value);
  }
  return formData;
}

async function seedArea(userId: string) {
  const area = await createArea(userId, {
    name: `Área ${crypto.randomUUID().slice(0, 8)}`,
    description: null,
    color: null,
    icon: null,
  });
  if (!area.ok) throw new Error('area failed');
  return area.item;
}

beforeEach(() => {
  mockedRequireUserId.mockReset();
  mockedRequireUserId.mockResolvedValue('__unset__');
});

describe('createHabitAction', () => {
  it('creates a free-form habit and redirects', async () => {
    const userId = await fixtures.createUser();
    const area = await seedArea(userId);
    signInAs(userId);

    await expect(
      createHabitAction(
        IDLE_STATE,
        formWith(
          {
            name: 'Meditar',
            trackingType: 'completion',
            frequencyKind: 'daily',
          },
          { areaIds: [area.id] },
        ),
      ),
    ).rejects.toThrow('NEXT_REDIRECT:/app/habits');

    expect((await listHabits(userId)).active[0]?.name).toBe('Meditar');
  });

  it('returns a neutral message for invalid input', async () => {
    const userId = await fixtures.createUser();
    const area = await seedArea(userId);
    signInAs(userId);

    const state = await createHabitAction(
      IDLE_STATE,
      formWith(
        { name: '  ', trackingType: 'completion', frequencyKind: 'daily' },
        { areaIds: [area.id] },
      ),
    );

    expect(state).toEqual({
      status: 'error',
      message: 'Dê um nome ao hábito.',
    });
  });

  it('ignores a userId sent by the client', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    const area = await seedArea(userA);
    signInAs(userA);

    await expect(
      createHabitAction(
        IDLE_STATE,
        formWith(
          {
            name: 'Água',
            trackingType: 'quantity',
            frequencyKind: 'daily',
            targetValue: '2000',
            unit: 'ml',
            userId: userB,
          },
          { areaIds: [area.id] },
        ),
      ),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect((await listHabits(userB)).active).toEqual([]);
  });
});

describe('isolation', () => {
  it('does not archive another user habit', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    const areaB = await seedArea(userB);
    const habitB = await createHabit(userB, {
      name: 'Meditar',
      trackingType: 'completion',
      frequencyKind: 'daily',
      weekdays: null,
      targetValue: null,
      unit: null,
      areaIds: [areaB.id],
    });
    if (!habitB.ok) throw new Error('setup');
    signInAs(userA);

    const state = await archiveHabitAction(
      IDLE_STATE,
      formWith({ id: habitB.item.id }),
    );

    expect(state).toEqual({ status: 'error', message: 'Item não encontrado.' });
    expect((await listHabits(userB)).active).toHaveLength(1);
  });

  it('does not update another user habit', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    const areaA = await seedArea(userA);
    const areaB = await seedArea(userB);
    const habitB = await createHabit(userB, {
      name: 'Meditar',
      trackingType: 'completion',
      frequencyKind: 'daily',
      weekdays: null,
      targetValue: null,
      unit: null,
      areaIds: [areaB.id],
    });
    if (!habitB.ok) throw new Error('setup');
    signInAs(userA);

    const state = await updateHabitAction(
      IDLE_STATE,
      formWith(
        {
          id: habitB.item.id,
          name: 'Hack',
          trackingType: 'completion',
          frequencyKind: 'daily',
        },
        { areaIds: [areaA.id] },
      ),
    );

    expect(state).toEqual({ status: 'error', message: 'Item não encontrado.' });
  });
});
