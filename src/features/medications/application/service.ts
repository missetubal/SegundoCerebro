import 'server-only';
import type { z } from 'zod';
import { getPreferences } from '@/features/preferences/server';
import { calendarDateInTimeZone } from '@/shared/lib/calendar';
import { firstIssueMessage } from '@/shared/lib/validation';
import {
  entryDateSchema,
  medicationDayPutSchema,
  medicationFailureMessage,
  medicationLogRangeSchema,
  medicationWriteSchema,
  type MedicationDayPut,
  type MedicationWrite,
} from '../domain';
import {
  createMedication,
  getMedication,
  listMedicationLogs,
  listMedications,
  listOccurrencesForDate,
  prepareMedicationDay,
  saveMedicationDay,
  updateMedication,
  type Medication,
  type MedicationOccurrence,
  type StoredMedicationLog,
} from '../infra';

export type MedicationCommand<T> =
  | { ok: true; item: T }
  | { ok: false; message: string };

const invalidDate = 'Data inválida.';
const mixedQuery = 'Informe uma data ou um intervalo, não os dois.';

function issueMessage(error: z.ZodError): string {
  if (error.issues.some((issue) => issue.code === 'unrecognized_keys')) {
    return 'Revise os campos.';
  }
  return firstIssueMessage(error, 'Revise os campos.');
}

async function todayFor(userId: string): Promise<string> {
  const preferences = await getPreferences(userId);
  return calendarDateInTimeZone(preferences.timezone);
}

function withStartsOn(input: MedicationWrite, startsOn: string) {
  return { ...input, startsOn: input.startsOn ?? startsOn };
}

export async function createMedicationForUser(
  userId: string,
  input: unknown,
): Promise<MedicationCommand<Medication>> {
  const parsed = medicationWriteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: issueMessage(parsed.error) };
  const today = await todayFor(userId);
  const item = await createMedication(userId, withStartsOn(parsed.data, today));
  return { ok: true, item };
}

export async function updateMedicationForUser(
  userId: string,
  id: string,
  input: unknown,
): Promise<MedicationCommand<Medication>> {
  const parsed = medicationWriteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: issueMessage(parsed.error) };
  const existing = await getMedication(userId, id);
  if (!existing) return { ok: false, message: 'Esse medicamento não está disponível.' };
  const today = await todayFor(userId);
  const saved = await updateMedication(
    userId,
    id,
    withStartsOn(
      { ...parsed.data, startsOn: parsed.data.startsOn ?? existing.startsOn },
      today,
    ),
  );
  if (!saved.ok) return { ok: false, message: 'Esse medicamento não está disponível.' };
  return { ok: true, item: saved.item };
}

export async function readMedicationDay(
  userId: string,
  entryDate: string,
): Promise<MedicationCommand<MedicationOccurrence[]>> {
  const date = entryDateSchema.safeParse(entryDate);
  if (!date.success) return { ok: false, message: invalidDate };
  const today = await todayFor(userId);
  if (date.data > today) {
    return { ok: false, message: medicationFailureMessage('future') };
  }
  return { ok: true, item: await listOccurrencesForDate(userId, date.data) };
}

export async function readMedicationLogRange(
  userId: string,
  from: string | null,
  to: string | null,
): Promise<
  { ok: true; items: StoredMedicationLog[] } | { ok: false; message: string }
> {
  const range = medicationLogRangeSchema.safeParse({ from, to });
  if (!range.success) {
    return { ok: false, message: firstIssueMessage(range.error, 'Revise o intervalo.') };
  }
  return {
    ok: true,
    items: await listMedicationLogs(userId, range.data.from, range.data.to),
  };
}

export async function saveMedicationDayForUser(
  userId: string,
  entryDate: string,
  input: unknown,
): Promise<MedicationCommand<MedicationOccurrence[]>> {
  const date = entryDateSchema.safeParse(entryDate);
  if (!date.success) return { ok: false, message: invalidDate };
  const body = medicationDayPutSchema.safeParse(input);
  if (!body.success) return { ok: false, message: issueMessage(body.error) };
  const today = await todayFor(userId);
  const saved = await saveMedicationDay(userId, date.data, body.data, today);
  if (!saved.ok) return { ok: false, message: medicationFailureMessage(saved.reason) };
  return { ok: true, item: saved.occurrences };
}

/** Validates medication marks, including a future date, before the check-in write. */
export async function prepareMedicationDayForUser(
  userId: string,
  entryDate: string,
  input: MedicationDayPut,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const date = entryDateSchema.safeParse(entryDate);
  if (!date.success) return { ok: false, message: invalidDate };
  const today = await todayFor(userId);
  const ready = await prepareMedicationDay(userId, date.data, input, today);
  if (!ready.ok) return { ok: false, message: medicationFailureMessage(ready.reason) };
  return { ok: true };
}

export async function commitMedicationDayForUser(
  userId: string,
  entryDate: string,
  input: MedicationDayPut,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const saved = await saveMedicationDayForUser(userId, entryDate, input);
  if (!saved.ok) return saved;
  return { ok: true };
}

export function toMedicationJson(item: Medication) {
  return {
    id: item.id,
    name: item.name,
    instructions: item.instructions,
    frequencyKind: item.frequencyKind,
    weekdays: item.weekdays,
    times: item.times,
    startsOn: item.startsOn,
    archivedAt: item.archivedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function toOccurrenceJson(item: MedicationOccurrence) {
  return {
    medicationId: item.medicationId,
    name: item.name,
    scheduledTime: item.scheduledTime,
    status: item.status,
    takenAt: item.takenAt?.toISOString() ?? null,
    orphan: item.orphan,
  };
}

export function toStoredLogJson(item: StoredMedicationLog) {
  return {
    id: item.id,
    medicationId: item.medicationId,
    name: item.name,
    entryDate: item.entryDate,
    scheduledTime: item.scheduledTime,
    status: item.status,
    takenAt: item.takenAt?.toISOString() ?? null,
  };
}

export { listMedications, mixedQuery };
