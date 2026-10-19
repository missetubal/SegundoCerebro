import 'server-only';
import { auth } from '@/features/auth/server';
import {
  readCheckIn,
  readCheckInRange,
  removeCheckIn,
  saveCheckIn,
  toCheckInJson,
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

export async function getCheckInHttp(entryDate: string): Promise<Response> {
  const userId = await apiUserId();
  if (userId instanceof Response) return userId;
  const result = await readCheckIn(userId, entryDate);
  if (!result.ok) return invalid(result.message);
  return Response.json(toCheckInJson(result.item));
}

export async function putCheckInHttp(
  entryDate: string,
  request: Request,
): Promise<Response> {
  const userId = await apiUserId();
  if (userId instanceof Response) return userId;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalid('Revise os campos.');
  }
  const result = await saveCheckIn(userId, entryDate, body);
  if (!result.ok) return invalid(result.message);
  return Response.json(toCheckInJson(result.item));
}

export async function deleteCheckInHttp(entryDate: string): Promise<Response> {
  const userId = await apiUserId();
  if (userId instanceof Response) return userId;
  const result = await removeCheckIn(userId, entryDate);
  if (!result.ok) return invalid(result.message);
  return new Response(null, { status: 204 });
}

export async function listCheckInsHttp(request: Request): Promise<Response> {
  const userId = await apiUserId();
  if (userId instanceof Response) return userId;
  const url = new URL(request.url);
  const result = await readCheckInRange(
    userId,
    url.searchParams.get('from'),
    url.searchParams.get('to'),
  );
  if (!result.ok) return invalid(result.message);
  return Response.json({ checkIns: result.items.map(toCheckInJson) });
}
