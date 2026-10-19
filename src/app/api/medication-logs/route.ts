import { listMedicationLogsHttp } from '@/features/medications/server';

export function GET(request: Request): Promise<Response> {
  return listMedicationLogsHttp(request);
}
