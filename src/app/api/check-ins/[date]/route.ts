import {
  deleteCheckInHttp,
  getCheckInHttp,
  putCheckInHttp,
} from '@/features/check-ins/server';

type DateContext = { params: Promise<{ date: string }> };

export async function GET(
  _request: Request,
  context: DateContext,
): Promise<Response> {
  const { date } = await context.params;
  return getCheckInHttp(date);
}

export async function PUT(
  request: Request,
  context: DateContext,
): Promise<Response> {
  const { date } = await context.params;
  return putCheckInHttp(date, request);
}

export async function DELETE(
  _request: Request,
  context: DateContext,
): Promise<Response> {
  const { date } = await context.params;
  return deleteCheckInHttp(date);
}
