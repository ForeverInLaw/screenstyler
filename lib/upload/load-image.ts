import type { ImageRef } from '@/lib/document/schema';
import { blobStore } from '@/lib/storage/blob-store-instance';

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
  const ref: ImageRef = {
    id: crypto.randomUUID(),
    blobKey: `img-${crypto.randomUUID()}`,
    naturalWidth: bitmap.width,
    naturalHeight: bitmap.height,
  };
  bitmap.close();
  await blobStore.put(ref.blobKey, file);
  return ref;
}
