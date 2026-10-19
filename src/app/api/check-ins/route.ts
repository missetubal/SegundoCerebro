import { listCheckInsHttp } from '@/features/check-ins/server';

export async function GET(request: Request): Promise<Response> {
  return listCheckInsHttp(request);
}
