import 'server-only';
import { redirect } from 'next/navigation';
import { auth } from './next-auth';

export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/signin');
  return userId;
}
