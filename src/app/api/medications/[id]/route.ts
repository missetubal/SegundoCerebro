import {
  deleteMedicationHttp,
  updateMedicationHttp,
} from '@/features/medications/server';

type IdContext = { params: Promise<{ id: string }> };

export async function PATCH(
  request: Request,
  context: IdContext,
): Promise<Response> {
  const { id } = await context.params;
  return updateMedicationHttp(id, request);
}

export async function DELETE(
  _request: Request,
  context: IdContext,
): Promise<Response> {
  const { id } = await context.params;
  return deleteMedicationHttp(id);
}
