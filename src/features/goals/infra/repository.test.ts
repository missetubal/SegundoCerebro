import { afterAll, describe, expect, it } from 'vitest';
import { createArea } from '@/features/areas/server';
import { listHorizons } from '@/features/horizons/server';
import { createUserFixtures } from '@/test/fixtures';
import type { GoalInput } from '../domain';
import {
  completeNextStep,
  createGoal,
  createNextStep,
  deleteGoal,
  deleteNextStep,
  getGoal,
  listGoals,
  listNextSteps,
  setGoalStatus,
  updateGoal,
} from './repository';

const fixtures = createUserFixtures();
afterAll(() => fixtures.cleanup());

async function seedAreaAndHorizon(userId: string) {
  const area = await createArea(userId, {
    name: `Área ${crypto.randomUUID().slice(0, 8)}`,
    description: null,
    color: null,
    icon: null,
  });
  if (!area.ok) throw new Error('Could not create area');
  const horizons = await listHorizons(userId);
  const horizon = horizons[0];
  if (!horizon) throw new Error('Expected seeded horizons');
  return { areaId: area.item.id, horizonId: horizon.id };
}

function goalInput(
  areaId: string,
  horizonId: string,
  overrides: Partial<GoalInput> = {},
): GoalInput {
  return {
    title: 'Correr 5 km',
    primaryAreaId: areaId,
    horizonId,
    status: 'active',
    startDate: null,
    targetDate: null,
    ...overrides,
  };
}

describe('createGoal and listGoals', () => {
  it('creates a goal linked to area and horizon', async () => {
    const userId = await fixtures.createUser();
    const { areaId, horizonId } = await seedAreaAndHorizon(userId);

    const result = await createGoal(userId, goalInput(areaId, horizonId));

    expect(result.ok && result.item).toMatchObject({
      title: 'Correr 5 km',
      primaryAreaId: areaId,
      horizonId,
      status: 'active',
    });
    const listed = await listGoals(userId);
    expect(listed.active).toHaveLength(1);
  });

  it('rejects an area belonging to another user', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    const { areaId } = await seedAreaAndHorizon(userB);
    const { horizonId } = await seedAreaAndHorizon(userA);

    const result = await createGoal(userA, goalInput(areaId, horizonId));

    expect(result).toEqual({ ok: false, reason: 'invalid_area' });
  });

  it('rejects a horizon belonging to another user', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    const { areaId } = await seedAreaAndHorizon(userA);
    const { horizonId } = await seedAreaAndHorizon(userB);

    const result = await createGoal(userA, goalInput(areaId, horizonId));

    expect(result).toEqual({ ok: false, reason: 'invalid_horizon' });
  });
});

describe('updateGoal and status', () => {
  it('updates fields and moves status buckets', async () => {
    const userId = await fixtures.createUser();
    const { areaId, horizonId } = await seedAreaAndHorizon(userId);
    const created = await createGoal(userId, goalInput(areaId, horizonId));
    if (!created.ok) throw new Error('create failed');

    const updated = await updateGoal(
      userId,
      created.item.id,
      goalInput(areaId, horizonId, { title: 'Correr 10 km' }),
    );
    expect(updated.ok && updated.item.title).toBe('Correr 10 km');

    await setGoalStatus(userId, created.item.id, 'completed');
    expect((await listGoals(userId)).completed).toHaveLength(1);
    expect((await listGoals(userId)).active).toHaveLength(0);
  });
});

describe('next steps', () => {
  it('allows a goal with no next steps and supports CRUD', async () => {
    const userId = await fixtures.createUser();
    const { areaId, horizonId } = await seedAreaAndHorizon(userId);
    const created = await createGoal(userId, goalInput(areaId, horizonId));
    if (!created.ok) throw new Error('create failed');

    expect(await listNextSteps(userId, created.item.id)).toEqual([]);

    const step = await createNextStep(userId, created.item.id, {
      title: 'Comprar tênis',
    });
    expect(step.ok && step.item.title).toBe('Comprar tênis');

    await completeNextStep(userId, step.ok ? step.item.id : '');
    const listed = await listNextSteps(userId, created.item.id);
    expect(listed[0]?.status).toBe('done');

    await deleteNextStep(userId, listed[0]!.id);
    expect(await listNextSteps(userId, created.item.id)).toEqual([]);
  });
});

describe('isolation between users', () => {
  it('keeps goals and next steps isolated', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    const a = await seedAreaAndHorizon(userA);
    const b = await seedAreaAndHorizon(userB);

    const goalB = await createGoal(userB, goalInput(b.areaId, b.horizonId));
    if (!goalB.ok) throw new Error('create B failed');
    const stepB = await createNextStep(userB, goalB.item.id, {
      title: 'Passo B',
    });
    if (!stepB.ok) throw new Error('step B failed');

    expect(await getGoal(userA, goalB.item.id)).toBeNull();
    expect(
      await updateGoal(
        userA,
        goalB.item.id,
        goalInput(a.areaId, a.horizonId, { title: 'Hack' }),
      ),
    ).toEqual({ ok: false, reason: 'not_found' });
    expect(await setGoalStatus(userA, goalB.item.id, 'archived')).toBe(false);
    expect(await deleteGoal(userA, goalB.item.id)).toBe(false);
    expect(await completeNextStep(userA, stepB.item.id)).toBe(false);
    expect(await deleteNextStep(userA, stepB.item.id)).toBe(false);

    expect(await getGoal(userB, goalB.item.id)).not.toBeNull();
    expect(await listNextSteps(userB, goalB.item.id)).toHaveLength(1);
  });
});
