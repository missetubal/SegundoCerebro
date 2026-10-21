import { auth } from '@/features/auth/server';
import { defaultBlobStore, localBlobKey } from '@/features/finance/infra/blob-store';
import { getStatement, signedStatementUrl } from '@/features/finance/server';

type FileContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: Request,
  context: FileContext,
): Promise<Response> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response(null, { status: 401 });
  const { id } = await context.params;
  const url = await signedStatementUrl(userId, id);
  if (!url) return new Response(null, { status: 404 });
  const key = localBlobKey(url);
  if (!key) return Response.redirect(url, 302);
  const statement = await getStatement(userId, id);
  const bytes = await defaultBlobStore().read(key);
  const fileName = (statement?.fileName ?? 'fatura').replace(/["\r\n]/g, '');
  return new Response(Buffer.from(bytes), {
    headers: {
      'content-type': statement?.mimeType ?? 'application/octet-stream',
      'content-disposition': `attachment; filename="${fileName}"`,
      'cache-control': 'private, no-store',
    },
  });
}
