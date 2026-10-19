import 'server-only';
import { auth } from '@/features/auth/server';
import { deleteMedication, getMedication, listMedications } from '../infra';
import {
  createMedicationForUser,
  mixedQuery,
  readMedicationDay,
  readMedicationLogRange,
  saveMedicationDayForUser,
  toMedicationJson,
  toOccurrenceJson,
  toStoredLogJson,
  updateMedicationForUser,
} from './service';

async function apiUserId(): Promise<string | Response> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  return userId;
}

function invalid(message: string): Response {
  return Response.json({ error: 'invalid', message }, { status: 400 });
}

function notFound(): Response {
  return Response.json({ error: 'not_found' }, { status: 404 });
}

async function readJson(request: Request): Promise<unknown | Response> {
  try {
    return await request.json();
  } catch {
    return invalid('Revise os campos.');
  }
}

export async function listMedicationsHttp(): Promise<Response> {
  const userId = await apiUserId();
  if (userId instanceof Response) return userId;
  const listed = await listMedications(userId);
  return Response.json({
    active: listed.active.map(toMedicationJson),
    archived: listed.archived.map(toMedicationJson),
  });
}

export async function createMedicationHttp(request: Request): Promise<Response> {
  const userId = await apiUserId();
  if (userId instanceof Response) return userId;
  const body = await readJson(request);
  if (body instanceof Response) return body;
  const created = await createMedicationForUser(userId, body);
  if (!created.ok) return invalid(created.message);
  return Response.json(toMedicationJson(created.item), { status: 201 });
}

export async function updateMedicationHttp(
  id: string,
  request: Request,
): Promise<Response> {
  const userId = await apiUserId();
  if (userId instanceof Response) return userId;
  const body = await readJson(request);
  if (body instanceof Response) return body;
  const existing = await getMedication(userId, id);
  if (!existing) return notFound();
  const updated = await updateMedicationForUser(userId, id, body);
  if (!updated.ok) {
    if (updated.message === 'Esse medicamento não está disponível.') return notFound();
    return invalid(updated.message);
  }
  return Response.json(toMedicationJson(updated.item));
}

export async function deleteMedicationHttp(id: string): Promise<Response> {
  const userId = await apiUserId();
  if (userId instanceof Response) return userId;
  const removed = await deleteMedication(userId, id);
  if (!removed) return notFound();
  return new Response(null, { status: 204 });
}

export async function listMedicationLogsHttp(request: Request): Promise<Response> {
  const userId = await apiUserId();
  if (userId instanceof Response) return userId;
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const hasRange = from !== null || to !== null;
  if (date && hasRange) return invalid(mixedQuery);
  if (date) {
    const day = await readMedicationDay(userId, date);
    if (!day.ok) return invalid(day.message);
    return Response.json({
      entryDate: date,
      occurrences: day.item.map(toOccurrenceJson),
    });
  }
  if (!hasRange) return invalid('Informe uma data ou um intervalo.');
  const range = await readMedicationLogRange(userId, from, to);
  if (!range.ok) return invalid(range.message);
  return Response.json({ logs: range.items.map(toStoredLogJson) });
}

export async function putMedicationDayHttp(
  entryDate: string,
  request: Request,
): Promise<Response> {
  const userId = await apiUserId();
  if (userId instanceof Response) return userId;
  const body = await readJson(request);
  if (body instanceof Response) return body;
  const saved = await saveMedicationDayForUser(userId, entryDate, body);
  if (!saved.ok) return invalid(saved.message);
  return Response.json({
    entryDate,
    occurrences: saved.item.map(toOccurrenceJson),
  });
}
