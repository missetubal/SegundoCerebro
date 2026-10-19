import { putMedicationDayHttp } from '@/features/medications/server';

type DateContext = { params: Promise<{ date: string }> };

export async function PUT(
  request: Request,
  context: DateContext,
): Promise<Response> {
  const { date } = await context.params;
  return putMedicationDayHttp(date, request);
}
