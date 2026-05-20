import type { ImageRef } from '@/lib/document/schema';
import { getBlobStore, getActiveUserId } from '@/lib/storage/active-stores';

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 25 * 1024 * 1024;

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: 'UNSUPPORTED_TYPE' | 'TOO_LARGE' };

export function validateImageFile(file: File): ValidationResult {
  if (!ALLOWED.includes(file.type)) return { ok: false, reason: 'UNSUPPORTED_TYPE' };
  if (file.size > MAX_BYTES) return { ok: false, reason: 'TOO_LARGE' };
  return { ok: true };
}

export async function ingestImageFile(file: File): Promise<ImageRef> {
  const bitmap = await createImageBitmap(file);
  const userId = getActiveUserId();
  const baseKey = `img-${crypto.randomUUID()}`;
  const blobKey = userId ? `users/${userId}/${baseKey}` : baseKey;
  const ref: ImageRef = {
    id: crypto.randomUUID(),
    blobKey,
    naturalWidth: bitmap.width,
    naturalHeight: bitmap.height,
  };
  bitmap.close();
  await getBlobStore().put(ref.blobKey, file);
  return ref;
}
