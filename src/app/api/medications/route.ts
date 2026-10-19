import {
  createMedicationHttp,
  listMedicationsHttp,
} from '@/features/medications/server';

export function GET(): Promise<Response> {
  return listMedicationsHttp();
}

export function POST(request: Request): Promise<Response> {
  return createMedicationHttp(request);
}
