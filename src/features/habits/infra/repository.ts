import 'server-only';
import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { db, ownedBy } from '@/shared/db';
import { areas, habitAreas, habits } from '@/shared/db';
import { isoWeekdayFromDateYmd } from '@/shared/lib/calendar';
import type { HabitInput } from '../domain';

export type Habit = typeof habits.$inferSelect;

export type HabitWithAreas = Habit & { areaIds: string[] };

export type HabitWriteResult =
  | { ok: true; item: HabitWithAreas }
  | { ok: false; reason: 'not_found' | 'invalid_area' };

async function assertHabitAreas(
  userId: string,
  areaIds: string[],
  options: { allowArchivedIds?: string[] } = {},
): Promise<boolean> {
  const unique = [...new Set(areaIds)];
  if (unique.length === 0) return false;

  const allowedArchived = new Set(options.allowArchivedIds ?? []);
  const rows = await db
    .select({ id: areas.id, archivedAt: areas.archivedAt })
    .from(areas)
    .where(and(eq(areas.userId, userId), inArray(areas.id, unique)));

  if (rows.length !== unique.length) return false;

  return rows.every(
    (row) =>
      row.archivedAt === null || allowedArchived.has(row.id),
  );
}

async function loadAreaIds(habitIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (habitIds.length === 0) return map;

  const rows = await db
    .select()
    .from(habitAreas)
    .where(inArray(habitAreas.habitId, habitIds));

  for (const row of rows) {
    const list = map.get(row.habitId) ?? [];
    list.push(row.areaId);
    map.set(row.habitId, list);
  }
  return map;
}

function withAreas(habit: Habit, areaIds: string[]): HabitWithAreas {
  return { ...habit, areaIds };
}

export async function listHabits(userId: string): Promise<{
  active: HabitWithAreas[];
  archived: HabitWithAreas[];
}> {
  const rows = await db
    .select()
    .from(habits)
    .where(eq(habits.userId, userId))
    .orderBy(asc(habits.createdAt), asc(habits.id));

  const areaMap = await loadAreaIds(rows.map((row) => row.id));
  const mapped = rows.map((row) => withAreas(row, areaMap.get(row.id) ?? []));

  return {
    active: mapped.filter((habit) => habit.archivedAt === null),
    archived: mapped
      .filter((habit) => habit.archivedAt !== null)
      .sort(
        (a, b) =>
          (b.archivedAt?.getTime() ?? 0) - (a.archivedAt?.getTime() ?? 0),
      ),
  };
}

export async function getHabit(
  userId: string,
  id: string,
): Promise<HabitWithAreas | null> {
  const [habit] = await db
    .select()
    .from(habits)
    .where(ownedBy(habits, userId, id));
  if (!habit) return null;
  const areaMap = await loadAreaIds([habit.id]);
  return withAreas(habit, areaMap.get(habit.id) ?? []);
}

export async function createHabit(
  userId: string,
  input: HabitInput,
): Promise<HabitWriteResult> {
  if (!(await assertHabitAreas(userId, input.areaIds))) {
    return { ok: false, reason: 'invalid_area' };
  }

  const habitId = crypto.randomUUID();
  const insertHabit = db.insert(habits).values({
    id: habitId,
    userId,
    name: input.name,
    trackingType: input.trackingType,
    frequencyKind: input.frequencyKind,
    weekdays: input.weekdays,
    targetValue: input.targetValue,
    unit: input.unit,
  });
  const insertAreas = db.insert(habitAreas).values(
    input.areaIds.map((areaId) => ({ habitId, areaId })),
  );

  await db.batch([insertHabit, insertAreas]);

  const created = await getHabit(userId, habitId);
  return created
    ? { ok: true, item: created }
    : { ok: false, reason: 'not_found' };
}

export async function updateHabit(
  userId: string,
  id: string,
  input: HabitInput,
): Promise<HabitWriteResult> {
  const existing = await getHabit(userId, id);
  if (!existing) return { ok: false, reason: 'not_found' };

  if (
    !(await assertHabitAreas(userId, input.areaIds, {
      allowArchivedIds: existing.areaIds,
    }))
  ) {
    return { ok: false, reason: 'invalid_area' };
  }

  const update = db
    .update(habits)
    .set({
      name: input.name,
      trackingType: input.trackingType,
      frequencyKind: input.frequencyKind,
      weekdays: input.weekdays,
      targetValue: input.targetValue,
      unit: input.unit,
      updatedAt: sql`now()`,
    })
    .where(ownedBy(habits, userId, id));
  const clearAreas = db.delete(habitAreas).where(eq(habitAreas.habitId, id));
  const insertAreas = db.insert(habitAreas).values(
    input.areaIds.map((areaId) => ({ habitId: id, areaId })),
  );

  await db.batch([update, clearAreas, insertAreas]);

  const updated = await getHabit(userId, id);
  return updated
    ? { ok: true, item: updated }
    : { ok: false, reason: 'not_found' };
}

export async function archiveHabit(
  userId: string,
  id: string,
): Promise<boolean> {
  const [item] = await db
    .update(habits)
    .set({ archivedAt: sql`now()`, updatedAt: sql`now()` })
    .where(and(ownedBy(habits, userId, id), isNull(habits.archivedAt)))
    .returning({ id: habits.id });
  return Boolean(item);
}

export async function unarchiveHabit(
  userId: string,
  id: string,
): Promise<boolean> {
  const [item] = await db
    .update(habits)
    .set({ archivedAt: null, updatedAt: sql`now()` })
    .where(ownedBy(habits, userId, id))
    .returning({ id: habits.id });
  return Boolean(item);
}

export async function listHabitsForDate(
  userId: string,
  dateYmd: string,
  timeZone: string,
): Promise<HabitWithAreas[]> {
  // Caller supplies dateYmd already resolved in `timeZone` (see preferences).
  void timeZone;
  const isoWeekday = isoWeekdayFromDateYmd(dateYmd);
  const { active } = await listHabits(userId);

  return active.filter((habit) => {
    if (habit.frequencyKind === 'daily') return true;
    const days = (habit.weekdays ?? []).map(Number);
    return days.includes(isoWeekday);
  });
}
