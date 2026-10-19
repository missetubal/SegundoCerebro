import 'server-only';
import { and, asc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { db } from '@/shared/db';
import { dailyCheckIns, habitLogs, habits } from '@/shared/db';
import { isHabitDueOnIsoWeekday } from '@/features/habits';
import { isoWeekdayFromDateYmd } from '@/shared/lib/calendar';
import type { CheckInFailureReason, CheckInHabitLog, CheckInPut } from '../domain';

export type CheckInHabitLogView = {
  id: string;
  habitId: string;
  habitName: string;
  completionStatus: 'done' | 'not_done' | null;
  value: number | null;
  unit: string | null;
};

export type CheckInView = {
  entryDate: string;
  generalNote: string | null;
  mood: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  habitLogs: CheckInHabitLogView[];
};

export type UpsertCheckInResult =
  | { ok: true; item: CheckInView }
  | { ok: false; reason: CheckInFailureReason };

type HabitRow = typeof habits.$inferSelect;

function emptyView(entryDate: string): CheckInView {
  return {
    entryDate,
    generalNote: null,
    mood: null,
    createdAt: null,
    updatedAt: null,
    habitLogs: [],
  };
}

function parseStatus(
  value: string | null,
): 'done' | 'not_done' | null {
  if (value === 'done' || value === 'not_done') return value;
  return null;
}

function isClearLog(
  log: CheckInHabitLog,
): log is { habitId: string; clear: true } {
  return 'clear' in log;
}

function isCompletionLog(
  log: CheckInHabitLog,
): log is { habitId: string; completionStatus: 'done' | 'not_done' } {
  return 'completionStatus' in log;
}

async function loadOwnedHabits(
  userId: string,
  habitIds: string[],
): Promise<Map<string, HabitRow> | null> {
  if (habitIds.length === 0) return new Map();
  const rows = await db
    .select()
    .from(habits)
    .where(and(eq(habits.userId, userId), inArray(habits.id, habitIds)));
  if (rows.length !== habitIds.length) return null;
  return new Map(rows.map((row) => [row.id, row]));
}

function classifyLogs(
  entryDate: string,
  logs: CheckInHabitLog[],
  owned: Map<string, HabitRow>,
): CheckInFailureReason | null {
  const isoWeekday = isoWeekdayFromDateYmd(entryDate);
  for (const log of logs) {
    const habit = owned.get(log.habitId);
    if (!habit) return 'invalid_habit';
    if (isClearLog(log)) continue;
    if (habit.archivedAt || !isHabitDueOnIsoWeekday(habit, isoWeekday)) {
      return 'not_applicable';
    }
    if (habit.trackingType === 'completion' && isCompletionLog(log)) continue;
    if (habit.trackingType === 'quantity' && 'value' in log) continue;
    return 'invalid_log';
  }
  return null;
}

async function readLogs(
  userId: string,
  entryDates: string[],
): Promise<Map<string, CheckInHabitLogView[]>> {
  const grouped = new Map<string, CheckInHabitLogView[]>();
  if (entryDates.length === 0) return grouped;

  const rows = await db
    .select({
      id: habitLogs.id,
      habitId: habitLogs.habitId,
      habitName: habits.name,
      entryDate: habitLogs.entryDate,
      completionStatus: habitLogs.completionStatus,
      value: habitLogs.value,
      unit: habitLogs.unit,
    })
    .from(habitLogs)
    .innerJoin(habits, eq(habitLogs.habitId, habits.id))
    .where(
      and(eq(habitLogs.userId, userId), inArray(habitLogs.entryDate, entryDates)),
    )
    .orderBy(asc(habitLogs.createdAt), asc(habitLogs.id));

  for (const row of rows) {
    const list = grouped.get(row.entryDate) ?? [];
    list.push({
      id: row.id,
      habitId: row.habitId,
      habitName: row.habitName,
      completionStatus: parseStatus(row.completionStatus),
      value: row.value,
      unit: row.unit,
    });
    grouped.set(row.entryDate, list);
  }
  return grouped;
}

export async function getCheckIn(
  userId: string,
  entryDate: string,
): Promise<CheckInView> {
  const [row] = await db
    .select()
    .from(dailyCheckIns)
    .where(
      and(
        eq(dailyCheckIns.userId, userId),
        eq(dailyCheckIns.entryDate, entryDate),
      ),
    );
  const logs = await readLogs(userId, [entryDate]);
  if (!row && (logs.get(entryDate)?.length ?? 0) === 0) {
    return emptyView(entryDate);
  }
  return {
    entryDate,
    generalNote: row?.generalNote ?? null,
    mood: row?.mood ?? null,
    createdAt: row?.createdAt ?? null,
    updatedAt: row?.updatedAt ?? null,
    habitLogs: logs.get(entryDate) ?? [],
  };
}

export async function listCheckIns(
  userId: string,
  from: string,
  to: string,
): Promise<CheckInView[]> {
  const rows = await db
    .select()
    .from(dailyCheckIns)
    .where(
      and(
        eq(dailyCheckIns.userId, userId),
        gte(dailyCheckIns.entryDate, from),
        lte(dailyCheckIns.entryDate, to),
      ),
    )
    .orderBy(asc(dailyCheckIns.entryDate));

  const logRows = await db
    .select({ entryDate: habitLogs.entryDate })
    .from(habitLogs)
    .where(
      and(
        eq(habitLogs.userId, userId),
        gte(habitLogs.entryDate, from),
        lte(habitLogs.entryDate, to),
      ),
    );

  const dates = new Set<string>([
    ...rows.map((row) => row.entryDate),
    ...logRows.map((row) => row.entryDate),
  ]);
  if (dates.size === 0) return [];

  const logs = await readLogs(userId, [...dates]);
  const byDate = new Map(rows.map((row) => [row.entryDate, row]));

  return [...dates].sort().map((entryDate) => {
    const row = byDate.get(entryDate);
    return {
      entryDate,
      generalNote: row?.generalNote ?? null,
      mood: row?.mood ?? null,
      createdAt: row?.createdAt ?? null,
      updatedAt: row?.updatedAt ?? null,
      habitLogs: logs.get(entryDate) ?? [],
    };
  });
}

type BatchQuery = Parameters<typeof db.batch>[0][number];

async function commit(statements: BatchQuery[]) {
  const [first, ...rest] = statements;
  if (!first) return;
  if (rest.length === 0) {
    await first;
    return;
  }
  await db.batch([first, ...rest]);
}

export async function upsertCheckIn(
  userId: string,
  entryDate: string,
  input: CheckInPut,
): Promise<UpsertCheckInResult> {
  const logs = input.habitLogs;
  let owned: Map<string, HabitRow> | null = null;
  if (logs && logs.length > 0) {
    owned = await loadOwnedHabits(
      userId,
      [...new Set(logs.map((log) => log.habitId))],
    );
    if (!owned) return { ok: false, reason: 'invalid_habit' };
    const failure = classifyLogs(entryDate, logs, owned);
    if (failure) return { ok: false, reason: failure };
  }

  const upsert = db
    .insert(dailyCheckIns)
    .values({
      userId,
      entryDate,
      generalNote: input.generalNote,
      mood: input.mood,
    })
    .onConflictDoUpdate({
      target: [dailyCheckIns.userId, dailyCheckIns.entryDate],
      set: {
        generalNote: input.generalNote,
        mood: input.mood,
        updatedAt: sql`now()`,
      },
    });

  const statements: BatchQuery[] = [upsert];
  if (logs && owned) {
    for (const log of logs) {
      if (isClearLog(log)) {
        statements.push(
          db
            .delete(habitLogs)
            .where(
              and(
                eq(habitLogs.userId, userId),
                eq(habitLogs.habitId, log.habitId),
                eq(habitLogs.entryDate, entryDate),
              ),
            ),
        );
        continue;
      }
      const habit = owned.get(log.habitId);
      if (!habit) return { ok: false, reason: 'invalid_habit' };
      if (isCompletionLog(log)) {
        statements.push(
          db
            .insert(habitLogs)
            .values({
              userId,
              habitId: log.habitId,
              entryDate,
              completionStatus: log.completionStatus,
              value: null,
              unit: null,
            })
            .onConflictDoUpdate({
              target: [
                habitLogs.userId,
                habitLogs.habitId,
                habitLogs.entryDate,
              ],
              set: {
                completionStatus: log.completionStatus,
                value: null,
                unit: null,
                updatedAt: sql`now()`,
              },
            }),
        );
        continue;
      }
      statements.push(
        db
          .insert(habitLogs)
          .values({
            userId,
            habitId: log.habitId,
            entryDate,
            completionStatus: null,
            value: log.value,
            unit: habit.unit,
          })
          .onConflictDoUpdate({
            target: [habitLogs.userId, habitLogs.habitId, habitLogs.entryDate],
            set: {
              completionStatus: null,
              value: log.value,
              unit: habit.unit,
              updatedAt: sql`now()`,
            },
          }),
      );
    }
  }

  await commit(statements);
  return { ok: true, item: await getCheckIn(userId, entryDate) };
}

export async function deleteCheckIn(
  userId: string,
  entryDate: string,
): Promise<void> {
  const clearLogs = db
    .delete(habitLogs)
    .where(
      and(eq(habitLogs.userId, userId), eq(habitLogs.entryDate, entryDate)),
    );
  const clearCheckIn = db
    .delete(dailyCheckIns)
    .where(
      and(
        eq(dailyCheckIns.userId, userId),
        eq(dailyCheckIns.entryDate, entryDate),
      ),
    );
  await db.batch([clearLogs, clearCheckIn]);
}
