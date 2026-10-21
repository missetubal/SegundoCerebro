import 'server-only';

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { del, get, issueSignedToken, presignUrl, put } from '@vercel/blob';

const SIGNED_URL_MS = 15 * 60 * 1000;

export type StoredBlob = { pathname: string };

export type BlobStore = {
  put(pathname: string, body: Blob | Buffer, contentType: string): Promise<StoredBlob>;
  remove(pathname: string): Promise<void>;
  read(pathname: string): Promise<Uint8Array>;
  signedDownloadUrl(pathname: string): Promise<string>;
};

export function signedUrlDeadline(now = Date.now()): number {
  return now + SIGNED_URL_MS;
}

export function vercelBlobStore(): BlobStore {
  return {
    async put(pathname, body, contentType) {
      const result = await put(pathname, body, {
        access: 'private',
        contentType,
        addRandomSuffix: true,
      });
      return { pathname: result.pathname };
    },
    async remove(pathname) {
      await del(pathname);
    },
    async read(pathname) {
      const result = await get(pathname, { access: 'private' });
      if (!result || result.statusCode === 304 || !result.stream) {
        throw new Error('finance statement upload failed');
      }
      return new Uint8Array(await new Response(result.stream).arrayBuffer());
    },
    async signedDownloadUrl(pathname) {
      const validUntil = signedUrlDeadline();
      const issued = await issueSignedToken({
        pathname,
        operations: ['get'],
        validUntil,
      });
      const signed = await presignUrl(
        {
          clientSigningToken: issued.clientSigningToken,
          delegationToken: issued.delegationToken,
        },
        {
          operation: 'get',
          pathname,
          access: 'private',
          validUntil: Math.min(validUntil, issued.validUntil),
        },
      );
      return signed.presignedUrl;
    },
  };
}

export function createMemoryBlobStore(): BlobStore {
  const files = new Map<string, Uint8Array>();
  return {
    async put(pathname, body) {
      const bytes = Buffer.isBuffer(body) ? body : Buffer.from(await body.arrayBuffer());
      files.set(pathname, bytes);
      return { pathname };
    },
    async remove(pathname) {
      files.delete(pathname);
    },
    async read(pathname) {
      const bytes = files.get(pathname);
      if (!bytes) throw new Error('finance statement upload failed');
      return bytes;
    },
    async signedDownloadUrl(pathname) {
      return `memory://download/${encodeURIComponent(pathname)}?exp=${signedUrlDeadline()}`;
    },
  };
}

const DISK_ROOT = path.join(process.cwd(), '.data', 'finance-blobs');

function diskPath(pathname: string) {
  const root = path.resolve(DISK_ROOT);
  const full = path.resolve(root, pathname.replace(/^\/+/, ''));
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error('finance statement upload failed');
  }
  return full;
}

export function localBlobKey(url: string): string | null {
  if (!url.startsWith('local-blob:')) return null;
  return decodeURIComponent(url.slice('local-blob:'.length));
}

export function createDiskBlobStore(): BlobStore {
  return {
    async put(pathname, body) {
      const full = diskPath(pathname);
      await mkdir(path.dirname(full), { recursive: true });
      const bytes = Buffer.isBuffer(body) ? body : Buffer.from(await body.arrayBuffer());
      await writeFile(full, bytes);
      return { pathname };
    },
    async remove(pathname) {
      await rm(diskPath(pathname), { force: true });
    },
    async read(pathname) {
      return readFile(diskPath(pathname));
    },
    async signedDownloadUrl(pathname) {
      return `local-blob:${encodeURIComponent(pathname)}`;
    },
  };
}

export function defaultBlobStore(): BlobStore {
  if (process.env.BLOB_READ_WRITE_TOKEN) return vercelBlobStore();
  return createDiskBlobStore();
}
