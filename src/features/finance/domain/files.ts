export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const EXTENSIONS: Record<string, string[]> = {
  pdf: ['application/pdf'],
  csv: ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'],
  ofx: ['application/x-ofx', 'application/ofx', 'text/plain', 'application/octet-stream'],
  qfx: ['application/vnd.intu.qfx', 'application/x-ofx', 'text/plain', 'application/octet-stream'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  webp: ['image/webp'],
};

export type FileKind = 'pdf' | 'csv' | 'ofx' | 'image';

export function inspectFile(
  fileName: string,
  mimeType: string,
  bytes: Uint8Array,
): { ok: true; kind: FileKind } | { ok: false; reason: 'empty' | 'too_large' | 'type' } {
  if (bytes.byteLength === 0) return { ok: false, reason: 'empty' };
  if (bytes.byteLength > MAX_FILE_BYTES) return { ok: false, reason: 'too_large' };
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  const allowed = EXTENSIONS[extension];
  if (!allowed || !allowed.includes(mimeType)) return { ok: false, reason: 'type' };
  if (extension === 'pdf' && !startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) {
    return { ok: false, reason: 'type' };
  }
  if ((extension === 'jpg' || extension === 'jpeg') && !startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return { ok: false, reason: 'type' };
  }
  if (extension === 'png' && !startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])) {
    return { ok: false, reason: 'type' };
  }
  if (extension === 'webp' && !isWebp(bytes)) return { ok: false, reason: 'type' };
  if ((extension === 'csv' || extension === 'ofx' || extension === 'qfx') && bytes.includes(0)) {
    return { ok: false, reason: 'type' };
  }
  const kind: FileKind =
    extension === 'pdf'
      ? 'pdf'
      : extension === 'csv'
        ? 'csv'
        : extension === 'ofx' || extension === 'qfx'
          ? 'ofx'
          : 'image';
  return { ok: true, kind };
}

function startsWith(bytes: Uint8Array, prefix: number[]) {
  return prefix.every((value, index) => bytes[index] === value);
}

function isWebp(bytes: Uint8Array) {
  return (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}
