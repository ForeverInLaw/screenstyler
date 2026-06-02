import type { ScreenstylerDoc } from './schema';
import { getBlobStoreForKey } from '@/lib/storage/active-stores';

function newBlobKey(userId: string | null): string {
  const base = `img-${crypto.randomUUID()}`;
  return userId ? `users/${userId}/${base}` : base;
}

/**
 * Copy a blob to a fresh key so the duplicate owns its own storage. Falls back
 * to the original key if the source blob can't be read (better to share than to
 * break the duplicate outright).
 */
async function copyBlob(oldKey: string, userId: string | null): Promise<string> {
  const blob = await getBlobStoreForKey(oldKey, userId).get(oldKey);
  if (!blob) return oldKey;
  const newKey = newBlobKey(userId);
  await getBlobStoreForKey(newKey, userId).put(newKey, blob);
  return newKey;
}

/**
 * Deep-clone a document and re-upload every blob it references under new keys.
 * Without this, a duplicated project shares blob keys with its source, so
 * deleting the source (which removes its R2 objects) breaks the copy.
 */
export async function duplicateDocWithBlobs(
  doc: ScreenstylerDoc,
  userId: string | null,
): Promise<ScreenstylerDoc> {
  const clone = structuredClone(doc);

  if (clone.content.image?.blobKey) {
    clone.content.image.blobKey = await copyBlob(clone.content.image.blobKey, userId);
  }
  if (clone.content.screenshots) {
    for (const s of clone.content.screenshots) {
      s.image.blobKey = await copyBlob(s.image.blobKey, userId);
    }
  }
  if (clone.canvas.background.type === 'image') {
    clone.canvas.background.ref.blobKey = await copyBlob(
      clone.canvas.background.ref.blobKey,
      userId,
    );
  }

  return clone;
}
