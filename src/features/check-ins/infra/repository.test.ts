import { afterAll, describe, expect, it } from 'vitest';
import { createArea } from '@/features/areas/server';
import { checkInFailureMessage } from '../domain';
import { archiveHabit, createHabit } from '@/features/habits/server';
import type { HabitInput } from '@/features/habits';
import { createUserFixtures } from '@/test/fixtures';
import { deleteCheckIn, getCheckIn, listCheckIns, upsertCheckIn } from './repository';

const fixtures = createUserFixtures();
afterAll(() => fixtures.cleanup());

const day = '2026-10-13';

async function ownedArea(userId: string) {
  const area = await createArea(userId, {
    name: `Saúde ${crypto.randomUUID().slice(0, 8)}`,
    description: null,
    color: null,
    icon: null,
  });
  if (!area.ok) throw new Error('Could not create area');
  return area.item;
}

async function ownedHabit(userId: string, input: HabitInput) {
  const habit = await createHabit(userId, input);
  if (!habit.ok) throw new Error('Could not create habit');
  return habit.item;
}

function completion(areaIds: string[], name = 'Meditar'): HabitInput {
  return {
    name,
    trackingType: 'completion',
    frequencyKind: 'daily',
    weekdays: null,
    targetValue: null,
    unit: null,
    areaIds,
  };
}

function quantity(areaIds: string[]): HabitInput {
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

describe('upsertCheckIn', () => {
  it('keeps createdAt, updates one quantity log, and skips unset habits', async () => {
    const userId = await fixtures.createUser();
    const area = await ownedArea(userId);
    const meditar = await ownedHabit(userId, completion([area.id]));
    const agua = await ownedHabit(userId, quantity([area.id]));

    const first = await upsertCheckIn(userId, day, {
      generalNote: 'Avancei no projeto',
      mood: null,
      habitLogs: [{ habitId: agua.id, value: 500 }],
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = await upsertCheckIn(userId, day, {
      generalNote: 'Nota nova',
      mood: 4,
      habitLogs: [{ habitId: agua.id, value: 750 }],
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;

    expect(second.item.createdAt?.toISOString()).toBe(
      first.item.createdAt?.toISOString(),
    );
    expect(second.item.generalNote).toBe('Nota nova');
    expect(second.item.habitLogs).toHaveLength(1);
    expect(second.item.habitLogs[0]).toMatchObject({
      habitId: agua.id,
      value: 750,
      unit: 'ml',
      completionStatus: null,
    });

    const cleared = await upsertCheckIn(userId, day, {
      generalNote: 'Nota nova',
      mood: 4,
      habitLogs: [{ habitId: meditar.id, clear: true }],
    });
    expect(cleared.ok).toBe(true);
    if (!cleared.ok) return;
    expect(cleared.item.habitLogs.map((log) => log.habitId)).toEqual([agua.id]);
    expect(
      cleared.item.habitLogs.some((log) => log.completionStatus === 'not_done'),
    ).toBe(false);
  });

  it('leaves existing logs alone when habitLogs is omitted', async () => {
    const userId = await fixtures.createUser();
    const area = await ownedArea(userId);
    const meditar = await ownedHabit(userId, completion([area.id]));
    await upsertCheckIn(userId, day, {
      generalNote: null,
      mood: null,
      habitLogs: [{ habitId: meditar.id, completionStatus: 'done' }],
    });

    const noteOnly = await upsertCheckIn(userId, day, {
      generalNote: 'só a nota',
      mood: null,
    });
    expect(noteOnly.ok && noteOnly.item.habitLogs).toMatchObject([
      { habitId: meditar.id, completionStatus: 'done' },
    ]);
  });
});

describe('rejected habit writes', () => {
  it('writes nothing for a foreign, archived, or off-day habit', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    const areaA = await ownedArea(userA);
    const areaB = await ownedArea(userB);
    const archived = await ownedHabit(userA, completion([areaA.id], 'Arquivado'));
    await archiveHabit(userA, archived.id);
    const monday = await ownedHabit(userA, {
      name: 'Segunda',
      trackingType: 'completion',
      frequencyKind: 'weekdays',
      weekdays: [1],
      targetValue: null,
      unit: null,
      areaIds: [areaA.id],
    });
    const foreign = await ownedHabit(userB, completion([areaB.id], 'Do B'));

    for (const habitId of [foreign.id, archived.id, monday.id]) {
      const result = await upsertCheckIn(userA, day, {
        generalNote: 'não deve gravar',
        mood: 2,
        habitLogs: [{ habitId, completionStatus: 'done' }],
      });
      expect(result.ok).toBe(false);
      if (habitId === archived.id || habitId === foreign.id) {
        expect(result).toMatchObject({ ok: false, reason: 'invalid_habit' });
      }
      if (result.ok) continue;
      const message = checkInFailureMessage(result.reason);
      expect(message.toLowerCase()).not.toMatch(/falh|culpa|puni/);
      const stored = await getCheckIn(userA, day);
      expect(stored.createdAt).toBeNull();
      expect(stored.habitLogs).toEqual([]);
    }

    const offDay = await upsertCheckIn(userA, day, {
      generalNote: null,
      mood: null,
      habitLogs: [{ habitId: monday.id, completionStatus: 'done' }],
    });
    expect(offDay).toMatchObject({ ok: false, reason: 'not_applicable' });
    expect(checkInFailureMessage('not_applicable')).toBe(
      'Esse hábito não se aplica a essa data.',
    );
  });
});

describe('isolation', () => {
  it('keeps check-ins and logs separated by user', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    const areaA = await ownedArea(userA);
    const areaB = await ownedArea(userB);
    const habitA = await ownedHabit(userA, completion([areaA.id], 'A'));
    const habitB = await ownedHabit(userB, completion([areaB.id], 'B'));

    await upsertCheckIn(userA, day, {
      generalNote: 'nota A',
      mood: 1,
      habitLogs: [{ habitId: habitA.id, completionStatus: 'done' }],
    });
    await upsertCheckIn(userB, day, {
      generalNote: 'nota B',
      mood: 5,
      habitLogs: [{ habitId: habitB.id, completionStatus: 'not_done' }],
    });

    const readA = await getCheckIn(userA, day);
    expect(readA.generalNote).toBe('nota A');
    expect(readA.habitLogs.map((log) => log.habitId)).toEqual([habitA.id]);

    const listed = await listCheckIns(userA, '2026-10-01', '2026-10-31');
    expect(listed.map((item) => item.entryDate)).toEqual([day]);
    expect(listed[0]?.generalNote).toBe('nota A');

    const stolen = await upsertCheckIn(userA, '2026-10-14', {
      generalNote: null,
      mood: null,
      habitLogs: [{ habitId: habitB.id, completionStatus: 'done' }],
    });
    expect(stolen).toEqual({ ok: false, reason: 'invalid_habit' });
    expect((await getCheckIn(userB, day)).generalNote).toBe('nota B');

    await deleteCheckIn(userA, day);
    expect((await getCheckIn(userA, day)).createdAt).toBeNull();
    expect((await getCheckIn(userB, day)).mood).toBe(5);
    expect((await getCheckIn(userA, '2026-10-14')).createdAt).toBeNull();
  }, 15_000);
});
