import { afterAll, describe, expect, it } from 'vitest';
import { createArea } from '@/features/areas/server';
import { createUserFixtures } from '@/test/fixtures';
import type { HabitInput } from '../domain';
import {
  archiveHabit,
  createHabit,
  getHabit,
  listHabits,
  listHabitsForDate,
  unarchiveHabit,
  updateHabit,
} from './repository';

const fixtures = createUserFixtures();
afterAll(() => fixtures.cleanup());

async function createOwnedArea(userId: string, name = 'Saúde') {
  const result = await createArea(userId, {
    name: `${name} ${crypto.randomUUID().slice(0, 8)}`,
    description: null,
    color: null,
    icon: null,
  });
  if (!result.ok) throw new Error('Could not create area');
  return result.item;
}

function completionInput(areaIds: string[]): HabitInput {
  return {
    name: 'Meditar',
    trackingType: 'completion',
    frequencyKind: 'daily',
    weekdays: null,
    targetValue: null,
    unit: null,
    areaIds,
  };
}

function quantityInput(areaIds: string[]): HabitInput {
  return {
    name: 'Água',
    trackingType: 'quantity',
    frequencyKind: 'daily',
    weekdays: null,
    targetValue: 2000,
    unit: 'ml',
    areaIds,
  };
}

describe('createHabit', () => {
  it('creates Meditar (completion) and Água (quantity)', async () => {
    const userId = await fixtures.createUser();
    const area = await createOwnedArea(userId);

    const meditar = await createHabit(userId, completionInput([area.id]));
    const agua = await createHabit(userId, quantityInput([area.id]));

    expect(meditar.ok && meditar.item).toMatchObject({
      name: 'Meditar',
      trackingType: 'completion',
      targetValue: null,
      unit: null,
      areaIds: [area.id],
    });
    expect(agua.ok && agua.item).toMatchObject({
      name: 'Água',
      trackingType: 'quantity',
      targetValue: 2000,
      unit: 'ml',
    });
  });

  it('rejects with no areas or foreign areas', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    const areaB = await createOwnedArea(userB);

    expect(
      await createHabit(userA, { ...completionInput([]), areaIds: [] }),
    ).toEqual({ ok: false, reason: 'invalid_area' });
    expect(await createHabit(userA, completionInput([areaB.id]))).toEqual({
      ok: false,
      reason: 'invalid_area',
    });
  });
});

describe('listHabitsForDate', () => {
  it('includes daily habits and weekday matches only', async () => {
    const userId = await fixtures.createUser();
    const area = await createOwnedArea(userId);

    await createHabit(userId, completionInput([area.id]));
    await createHabit(userId, {
      name: 'Treinar',
      trackingType: 'completion',
      frequencyKind: 'weekdays',
      weekdays: [1], // Monday
      targetValue: null,
      unit: null,
      areaIds: [area.id],
    });

    // 2026-10-16 is Friday (ISO 5)
    const friday = await listHabitsForDate(
      userId,
      '2026-10-16',
      'America/Sao_Paulo',
    );
    expect(friday.map((h) => h.name)).toEqual(['Meditar']);

    // 2026-10-19 is Monday (ISO 1)
    const monday = await listHabitsForDate(
      userId,
      '2026-10-19',
      'America/Sao_Paulo',
    );
    expect(monday.map((h) => h.name).sort()).toEqual(['Meditar', 'Treinar']);
  });

  it('excludes archived habits', async () => {
    const userId = await fixtures.createUser();
    const area = await createOwnedArea(userId);
    const created = await createHabit(userId, completionInput([area.id]));
    if (!created.ok) throw new Error('create failed');

    await archiveHabit(userId, created.item.id);
    expect(
      await listHabitsForDate(userId, '2026-10-16', 'America/Sao_Paulo'),
    ).toEqual([]);

    await unarchiveHabit(userId, created.item.id);
    expect(
      (await listHabitsForDate(userId, '2026-10-16', 'America/Sao_Paulo')).map(
        (h) => h.name,
      ),
    ).toEqual(['Meditar']);
  });
});

describe('updateHabit and isolation', () => {
  it('updates fields and keeps users isolated', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    const areaA = await createOwnedArea(userA);
    const areaB = await createOwnedArea(userB);

    const habitB = await createHabit(userB, completionInput([areaB.id]));
    if (!habitB.ok) throw new Error('create B failed');

    expect(await getHabit(userA, habitB.item.id)).toBeNull();
    expect(
      await updateHabit(userA, habitB.item.id, completionInput([areaA.id])),
    ).toEqual({ ok: false, reason: 'not_found' });
    expect(await archiveHabit(userA, habitB.item.id)).toBe(false);

    expect((await listHabits(userB)).active).toHaveLength(1);
  });
});
