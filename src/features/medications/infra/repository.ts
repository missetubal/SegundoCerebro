import 'server-only';
import { and, asc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import { db, deleteOwned, ownedBy } from '@/shared/db';
import { medicationLogs, medications } from '@/shared/db';
import { isoWeekdayFromDateYmd } from '@/shared/lib/calendar';
import {
  isScheduleDueOnIsoWeekday,
  parseFrequencyKind,
  parseLogStatus,
  type FrequencyKind,
  type MedicationDayPut,
  type MedicationFailureReason,
  type MedicationWrite,
} from '../domain';

export type Medication = Omit<
  typeof medications.$inferSelect,
  'frequencyKind'
> & {
  frequencyKind: FrequencyKind;
};

export type MedicationWriteResult =
  | { ok: true; item: Medication }
  | { ok: false; reason: 'not_found' };

export type OccurrenceStatus = 'done' | 'not_done' | 'pending';

export type MedicationOccurrence = {
  medicationId: string;
  name: string;
  scheduledTime: string;
  status: OccurrenceStatus;
  takenAt: Date | null;
  orphan: boolean;
};

export type StoredMedicationLog = {
  id: string;
  medicationId: string;
  name: string;
  entryDate: string;
  scheduledTime: string;
  status: 'done' | 'not_done';
  takenAt: Date | null;
};

export type SaveMedicationDayResult =
  | { ok: true; occurrences: MedicationOccurrence[] }
  | { ok: false; reason: MedicationFailureReason };

type MedicationRow = typeof medications.$inferSelect;

function toMedication(row: MedicationRow): Medication {
  return {
    ...row,
    frequencyKind: parseFrequencyKind(row.frequencyKind),
    times: row.times ?? [],
  };
}

function occurrenceKey(medicationId: string, scheduledTime: string): string {
  return `${medicationId}|${scheduledTime}`;
}

function applies(row: MedicationRow, entryDate: string, scheduledTime: string): boolean {
  if (row.archivedAt) return false;
  if (entryDate < row.startsOn) return false;
  if (!isScheduleDueOnIsoWeekday(row, isoWeekdayFromDateYmd(entryDate))) {
    return false;
  }
  return (row.times ?? []).includes(scheduledTime);
}

export async function listMedications(userId: string): Promise<{
  active: Medication[];
  archived: Medication[];
}> {
  const rows = await db
    .select()
    .from(medications)
    .where(eq(medications.userId, userId))
    .orderBy(asc(medications.createdAt), asc(medications.id));
  const mapped = rows.map(toMedication);
  return {
    active: mapped.filter((item) => item.archivedAt === null),
    archived: mapped
      .filter((item) => item.archivedAt !== null)
      .sort(
        (a, b) =>
          (b.archivedAt?.getTime() ?? 0) - (a.archivedAt?.getTime() ?? 0),
      ),
  };
}

export async function getMedication(
  userId: string,
  id: string,
): Promise<Medication | null> {
  const [row] = await db
    .select()
    .from(medications)
    .where(ownedBy(medications, userId, id));
  return row ? toMedication(row) : null;
}

export async function createMedication(
  userId: string,
  input: MedicationWrite & { startsOn: string },
): Promise<Medication> {
  const [row] = await db
    .insert(medications)
    .values({
      userId,
      name: input.name,
      instructions: input.instructions,
      frequencyKind: input.frequencyKind,
      weekdays: input.weekdays,
      times: input.times,
      startsOn: input.startsOn,
    })
    .returning();
  return toMedication(row);
}

export async function updateMedication(
  userId: string,
  id: string,
  input: MedicationWrite & { startsOn: string },
): Promise<MedicationWriteResult> {
  const [row] = await db
    .update(medications)
    .set({
      name: input.name,
      instructions: input.instructions,
      frequencyKind: input.frequencyKind,
      weekdays: input.weekdays,
      times: input.times,
      startsOn: input.startsOn,
      updatedAt: sql`now()`,
    })
    .where(ownedBy(medications, userId, id))
    .returning();
  return row
    ? { ok: true, item: toMedication(row) }
    : { ok: false, reason: 'not_found' };
}

export async function archiveMedication(
  userId: string,
  id: string,
): Promise<boolean> {
  const [item] = await db
    .update(medications)
    .set({ archivedAt: sql`now()`, updatedAt: sql`now()` })
    .where(and(ownedBy(medications, userId, id), isNull(medications.archivedAt)))
    .returning({ id: medications.id });
  return Boolean(item);
}

export async function unarchiveMedication(
  userId: string,
  id: string,
): Promise<boolean> {
  const [item] = await db
    .update(medications)
    .set({ archivedAt: null, updatedAt: sql`now()` })
    .where(ownedBy(medications, userId, id))
    .returning({ id: medications.id });
  return Boolean(item);
}

export async function deleteMedication(
  userId: string,
  id: string,
): Promise<boolean> {
  return deleteOwned(medications, userId, id);
}

async function readLogsForDate(userId: string, entryDate: string) {
  return db
    .select({
      id: medicationLogs.id,
      medicationId: medicationLogs.medicationId,
      name: medications.name,
      scheduledTime: medicationLogs.scheduledTime,
      status: medicationLogs.status,
      takenAt: medicationLogs.takenAt,
      createdAt: medicationLogs.createdAt,
    })
    .from(medicationLogs)
    .innerJoin(medications, eq(medicationLogs.medicationId, medications.id))
    .where(
      and(
        eq(medicationLogs.userId, userId),
        eq(medicationLogs.entryDate, entryDate),
      ),
    )
    .orderBy(asc(medicationLogs.scheduledTime), asc(medications.name));
}

export async function listOccurrencesForDate(
  userId: string,
  entryDate: string,
): Promise<MedicationOccurrence[]> {
  const [rows, logs] = await Promise.all([
    db
      .select()
      .from(medications)
      .where(eq(medications.userId, userId))
      .orderBy(asc(medications.name), asc(medications.id)),
    readLogsForDate(userId, entryDate),
  ]);

  const logByKey = new Map(
    logs.map((log) => [occurrenceKey(log.medicationId, log.scheduledTime), log]),
  );
  const covered = new Set<string>();
  const occurrences: MedicationOccurrence[] = [];

  for (const row of rows) {
    if (row.archivedAt) continue;
    if (entryDate < row.startsOn) continue;
    if (!isScheduleDueOnIsoWeekday(row, isoWeekdayFromDateYmd(entryDate))) {
      continue;
    }
    for (const scheduledTime of [...(row.times ?? [])].sort()) {
      const key = occurrenceKey(row.id, scheduledTime);
      const log = logByKey.get(key);
      const status = parseLogStatus(log?.status);
      occurrences.push({
        medicationId: row.id,
        name: row.name,
        scheduledTime,
        status: status ?? 'pending',
        takenAt: log?.takenAt ?? null,
        orphan: false,
      });
      covered.add(key);
    }
  }

  for (const log of logs) {
    const key = occurrenceKey(log.medicationId, log.scheduledTime);
    if (covered.has(key)) continue;
    const status = parseLogStatus(log.status);
    if (!status) continue;
    occurrences.push({
      medicationId: log.medicationId,
      name: log.name,
      scheduledTime: log.scheduledTime,
      status,
      takenAt: log.takenAt,
      orphan: true,
    });
  }

  return occurrences.sort((a, b) =>
    a.scheduledTime === b.scheduledTime
      ? a.name.localeCompare(b.name)
      : a.scheduledTime.localeCompare(b.scheduledTime),
  );
}

export async function listMedicationLogs(
  userId: string,
  from: string,
  to: string,
): Promise<StoredMedicationLog[]> {
  const rows = await db
    .select({
      id: medicationLogs.id,
      medicationId: medicationLogs.medicationId,
      name: medications.name,
      entryDate: medicationLogs.entryDate,
      scheduledTime: medicationLogs.scheduledTime,
      status: medicationLogs.status,
      takenAt: medicationLogs.takenAt,
    })
    .from(medicationLogs)
    .innerJoin(medications, eq(medicationLogs.medicationId, medications.id))
    .where(
      and(
        eq(medicationLogs.userId, userId),
        gte(medicationLogs.entryDate, from),
        lte(medicationLogs.entryDate, to),
      ),
    )
    .orderBy(
      asc(medicationLogs.entryDate),
      asc(medicationLogs.scheduledTime),
      asc(medicationLogs.id),
    );

  return rows.flatMap((row) => {
    const status = parseLogStatus(row.status);
    if (!status) return [];
    return [{ ...row, status }];
  });
}

type BatchQuery = Parameters<typeof db.batch>[0][number];

function takenAtOnConflict(status: 'done' | 'not_done') {
  if (status === 'not_done') return null;
  return sql`CASE WHEN ${medicationLogs.status} = 'done' THEN ${medicationLogs.takenAt} ELSE now() END`;
}

export function medicationDayStatements(
  userId: string,
  entryDate: string,
  logs: MedicationDayPut['logs'],
): BatchQuery[] {
  const statements: BatchQuery[] = [];
  for (const log of logs) {
    const where = and(
      eq(medicationLogs.userId, userId),
      eq(medicationLogs.medicationId, log.medicationId),
      eq(medicationLogs.entryDate, entryDate),
      eq(medicationLogs.scheduledTime, log.scheduledTime),
    );
    if (log.status === 'pending') {
      statements.push(db.delete(medicationLogs).where(where));
      continue;
    }
    statements.push(
      db
        .insert(medicationLogs)
        .values({
          userId,
          medicationId: log.medicationId,
          entryDate,
          scheduledTime: log.scheduledTime,
          status: log.status,
          takenAt: log.status === 'done' ? sql`now()` : null,
        })
        .onConflictDoUpdate({
          target: [
            medicationLogs.userId,
            medicationLogs.medicationId,
            medicationLogs.entryDate,
            medicationLogs.scheduledTime,
          ],
          set: {
            status: log.status,
            takenAt: takenAtOnConflict(log.status),
            updatedAt: sql`now()`,
          },
        }),
    );
  }
  return statements;
}

async function commit(statements: BatchQuery[]) {
  const [first, ...rest] = statements;
  if (!first) return;
  if (rest.length === 0) {
    await first;
    return;
  }
  await db.batch([first, ...rest]);
}

/** Read-only check used before any write, including the check-in save. */
export async function prepareMedicationDay(
  userId: string,
  entryDate: string,
  input: MedicationDayPut,
  today: string,
): Promise<{ ok: true } | { ok: false; reason: MedicationFailureReason }> {
  if (entryDate > today) return { ok: false, reason: 'future' };
  const logs = input.logs;
  if (logs.length === 0) return { ok: true };

  const ids = [...new Set(logs.map((log) => log.medicationId))];
  const rows = await db
    .select()
    .from(medications)
    .where(and(eq(medications.userId, userId), inArray(medications.id, ids)));
  if (rows.length !== ids.length) return { ok: false, reason: 'not_found' };
  const owned = new Map(rows.map((row) => [row.id, row]));

  const existing = await readLogsForDate(userId, entryDate);
  const existingKeys = new Set(
    existing.map((log) => occurrenceKey(log.medicationId, log.scheduledTime)),
  );

  for (const log of logs) {
    const row = owned.get(log.medicationId);
    if (!row) return { ok: false, reason: 'not_found' };
    const key = occurrenceKey(log.medicationId, log.scheduledTime);
    if (log.status === 'pending') {
      if (applies(row, entryDate, log.scheduledTime) || existingKeys.has(key)) {
        continue;
      }
      return { ok: false, reason: 'not_applicable' };
    }
    if (!applies(row, entryDate, log.scheduledTime)) {
      return { ok: false, reason: 'not_applicable' };
    }
  }
  return { ok: true };
}

export async function saveMedicationDay(
  userId: string,
  entryDate: string,
  input: MedicationDayPut,
  today: string,
): Promise<SaveMedicationDayResult> {
  const ready = await prepareMedicationDay(userId, entryDate, input, today);
  if (!ready.ok) return ready;
  const logs = input.logs;
  if (logs.length === 0) {
    return { ok: true, occurrences: await listOccurrencesForDate(userId, entryDate) };
  }

  await commit(medicationDayStatements(userId, entryDate, logs));
  return {
    ok: true,
    occurrences: await listOccurrencesForDate(userId, entryDate),
  };
}
