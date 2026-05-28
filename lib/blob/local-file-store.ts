import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const LOCAL_BLOB_DIR = process.env.LOCAL_BLOB_DIR ?? './local-blobs';

function ensureDir(): void {
  if (!existsSync(LOCAL_BLOB_DIR)) {
    mkdirSync(LOCAL_BLOB_DIR, { recursive: true });
  }
}

function getLocalBlobPath(key: string): string {
  // Prevent directory traversal by stripping path separators and dots
  const safeKey = key.replace(/\\/g, '/').split('/').filter(Boolean).join('/');
  if (!safeKey || safeKey.includes('..')) throw new Error('Invalid blob key');
  return join(LOCAL_BLOB_DIR, safeKey);
}

export function putLocalBlob(key: string, data: Buffer, contentType: string): void {
  ensureDir();
  const path = getLocalBlobPath(key);
  const dir = join(path, '..');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, data);
  writeFileSync(path + '.meta', JSON.stringify({ contentType }));
}

export function getLocalBlob(key: string): { data: Uint8Array; contentType: string } | undefined {
  const path = getLocalBlobPath(key);
  if (!existsSync(path)) return undefined;
  const data = readFileSync(path);
  let contentType = 'application/octet-stream';
  const metaPath = path + '.meta';
  if (existsSync(metaPath)) {
    try {
      const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
      if (meta.contentType) contentType = meta.contentType;
    } catch { /* ignore corrupt meta */ }
  }
  // Buffer is a Uint8Array subclass, but TypeScript 5.7+ models Buffer as
  // `Buffer<ArrayBufferLike>` which doesn't satisfy the narrower `Uint8Array`
  // type in some API signatures (e.g. Response constructor). The cast is
  // safe at runtime because every Buffer instance IS a Uint8Array.
  return { data: data as Uint8Array, contentType };
}

export function deleteLocalBlob(key: string): void {
  const path = getLocalBlobPath(key);
  if (existsSync(path)) {
    unlinkSync(path);
  }
  const metaPath = path + '.meta';
  if (existsSync(metaPath)) {
    unlinkSync(metaPath);
  }
}
