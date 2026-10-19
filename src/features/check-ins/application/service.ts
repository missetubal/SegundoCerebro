import 'server-only';
import { getPreferences } from '@/features/preferences/server';
import { calendarDateInTimeZone } from '@/shared/lib/calendar';
import { firstIssueMessage } from '@/shared/lib/validation';
import {
  checkInFailureMessage,
  checkInPutSchema,
  checkInRangeSchema,
  entryDateSchema,
} from '../domain';
import {
  deleteCheckIn,
  getCheckIn,
  listCheckIns,
  upsertCheckIn,
  type CheckInView,
} from '../infra';

export type CheckInCommandResult =
  | { ok: true; item: CheckInView }
  | { ok: false; message: string };

const invalidDate = 'Data inválida.';
const futureDate = 'Essa data ainda não está disponível.';

function stripClientUserId(input: unknown): unknown {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return input;
  }
  if (!Object.hasOwn(input, 'userId')) return input;
  const rest = { ...(input as Record<string, unknown>) };
  delete rest.userId;
  return rest;
}

export async function readCheckIn(
  userId: string,
  entryDate: string,
): Promise<CheckInCommandResult> {
  const date = entryDateSchema.safeParse(entryDate);
  if (!date.success) return { ok: false, message: invalidDate };
  return { ok: true, item: await getCheckIn(userId, date.data) };
}

export async function readCheckInRange(
  userId: string,
  from: string | null,
  to: string | null,
): Promise<{ ok: true; items: CheckInView[] } | { ok: false; message: string }> {
  const range = checkInRangeSchema.safeParse({ from, to });
  if (!range.success) {
    return {
      ok: false,
      message: firstIssueMessage(range.error, 'Revise o intervalo.'),
    };
  }
  return {
    ok: true,
    items: await listCheckIns(userId, range.data.from, range.data.to),
  };
}

export async function saveCheckIn(
  userId: string,
  entryDate: string,
  input: unknown,
  extra: Parameters<typeof upsertCheckIn>[3] = [],
): Promise<CheckInCommandResult> {
  const date = entryDateSchema.safeParse(entryDate);
  if (!date.success) return { ok: false, message: invalidDate };
  const body = checkInPutSchema.safeParse(stripClientUserId(input));
  if (!body.success) {
    return {
      ok: false,
      message: firstIssueMessage(body.error, 'Revise os campos.'),
    };
  }
  const preferences = await getPreferences(userId);
  const today = calendarDateInTimeZone(preferences.timezone);
  if (date.data > today) return { ok: false, message: futureDate };
  const saved = await upsertCheckIn(userId, date.data, body.data, extra);
  if (!saved.ok) {
    return { ok: false, message: checkInFailureMessage(saved.reason) };
  }
  return { ok: true, item: saved.item };
}

export async function removeCheckIn(
  userId: string,
  entryDate: string,
): Promise<CheckInCommandResult> {
  const date = entryDateSchema.safeParse(entryDate);
  if (!date.success) return { ok: false, message: invalidDate };
  await deleteCheckIn(userId, date.data);
  return { ok: true, item: await getCheckIn(userId, date.data) };
}

export function toCheckInJson(view: CheckInView) {
  return {
    entryDate: view.entryDate,
    generalNote: view.generalNote,
    mood: view.mood,
    createdAt: view.createdAt?.toISOString() ?? null,
    updatedAt: view.updatedAt?.toISOString() ?? null,
    habitLogs: view.habitLogs.map((log) => ({
      id: log.id,
      habitId: log.habitId,
      completionStatus: log.completionStatus,
      value: log.value,
      unit: log.unit,
    })),
  };
}
