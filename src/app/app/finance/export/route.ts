import { auth } from '@/features/auth/server';
import { exportFinance } from '@/features/finance/server';

export async function GET(): Promise<Response> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response(null, { status: 401 });
  const data = await exportFinance(userId);
  return new Response(JSON.stringify(data), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': 'attachment; filename="finance.json"',
    },
  });
}
