import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { requireUserId } from '@/features/auth/server';
import { createArea } from '@/features/areas/server';
import { listHorizons } from '@/features/horizons/server';
import { IDLE_STATE } from '@/shared/lib';
import { createUserFixtures } from '@/test/fixtures';
import { createGoal, getGoal, listGoals, listNextSteps } from '../infra';
import {
  createGoalAction,
  createNextStepAction,
  deleteGoalAction,
  setGoalStatusAction,
  updateGoalAction,
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

async function seed(userId: string) {
  const area = await createArea(userId, {
    name: `Área ${crypto.randomUUID().slice(0, 8)}`,
    description: null,
    color: null,
    icon: null,
  });
  if (!area.ok) throw new Error('area failed');
  const horizon = (await listHorizons(userId))[0];
  if (!horizon) throw new Error('horizon failed');
  return { areaId: area.item.id, horizonId: horizon.id };
}

beforeEach(() => {
  mockedRequireUserId.mockReset();
  mockedRequireUserId.mockResolvedValue('__unset__');
});

describe('createGoalAction', () => {
  it('creates a goal for the session user', async () => {
    const userId = await fixtures.createUser();
    const { areaId, horizonId } = await seed(userId);
    signInAs(userId);

    await expect(
      createGoalAction(
        IDLE_STATE,
        formWith({
          title: 'Correr 5 km',
          primaryAreaId: areaId,
          horizonId,
          status: 'active',
        }),
      ),
    ).rejects.toThrow(/^NEXT_REDIRECT:\/app\/goals\//);
  });

  it('returns a neutral message for invalid input', async () => {
    const userId = await fixtures.createUser();
    const { areaId, horizonId } = await seed(userId);
    signInAs(userId);

    const state = await createGoalAction(
      IDLE_STATE,
      formWith({
        title: '  ',
        primaryAreaId: areaId,
        horizonId,
        status: 'active',
      }),
    );

    expect(state).toEqual({ status: 'error', message: 'Dê um título à meta.' });
  });

  it('ignores a userId sent by the client', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    const { areaId, horizonId } = await seed(userA);
    signInAs(userA);

    await expect(
      createGoalAction(
        IDLE_STATE,
        formWith({
          title: 'Meta A',
          primaryAreaId: areaId,
          horizonId,
          status: 'active',
          userId: userB,
        }),
      ),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(await getGoal(userB, 'anything')).toBeNull();
  });
});

describe('updateGoalAction isolation', () => {
  it('does not change another user goal', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    const a = await seed(userA);
    const b = await seed(userB);
    const goalB = await createGoal(userB, {
      title: 'Meta B',
      primaryAreaId: b.areaId,
      horizonId: b.horizonId,
      status: 'active',
      startDate: null,
      targetDate: null,
    });
    if (!goalB.ok) throw new Error('setup');
    signInAs(userA);

    const state = await updateGoalAction(
      IDLE_STATE,
      formWith({
        id: goalB.item.id,
        title: 'Hack',
        primaryAreaId: a.areaId,
        horizonId: a.horizonId,
        status: 'active',
      }),
    );

    expect(state).toEqual({ status: 'error', message: 'Item não encontrado.' });
    expect((await getGoal(userB, goalB.item.id))?.title).toBe('Meta B');
  });
});

describe('createNextStepAction', () => {
  it('adds an optional next step', async () => {
    const userId = await fixtures.createUser();
    const { areaId, horizonId } = await seed(userId);
    const goal = await createGoal(userId, {
      title: 'Meta',
      primaryAreaId: areaId,
      horizonId,
      status: 'active',
      startDate: null,
      targetDate: null,
    });
    if (!goal.ok) throw new Error('setup');
    signInAs(userId);

    const state = await createNextStepAction(
      IDLE_STATE,
      formWith({ goalId: goal.item.id, title: 'Comprar tênis' }),
    );

    expect(state).toEqual({ status: 'success' });
    expect(await listNextSteps(userId, goal.item.id)).toHaveLength(1);
  });
});

describe('setGoalStatusAction and deleteGoalAction', () => {
  it('updates status for the session user', async () => {
    const userId = await fixtures.createUser();
    const { areaId, horizonId } = await seed(userId);
    const goal = await createGoal(userId, {
      title: 'Meta',
      primaryAreaId: areaId,
      horizonId,
      status: 'active',
      startDate: null,
      targetDate: null,
    });
    if (!goal.ok) throw new Error('setup');
    signInAs(userId);

    const state = await setGoalStatusAction(
      IDLE_STATE,
      formWith({ id: goal.item.id, status: 'completed' }),
    );

    expect(state).toEqual({ status: 'success' });
    expect((await listGoals(userId)).completed).toHaveLength(1);
  });

  it('deletes the goal and redirects', async () => {
    const userId = await fixtures.createUser();
    const { areaId, horizonId } = await seed(userId);
    const goal = await createGoal(userId, {
      title: 'Apagar',
      primaryAreaId: areaId,
      horizonId,
      status: 'active',
      startDate: null,
      targetDate: null,
    });
    if (!goal.ok) throw new Error('setup');
    signInAs(userId);

    await expect(
      deleteGoalAction(IDLE_STATE, formWith({ id: goal.item.id })),
    ).rejects.toThrow('NEXT_REDIRECT:/app/goals');

    expect(await getGoal(userId, goal.item.id)).toBeNull();
  });
});
