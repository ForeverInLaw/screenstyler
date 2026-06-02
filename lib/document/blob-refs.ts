import type { ScreenstylerDoc } from './schema';

/**
 * Collect every blob storage key a document references: per-screenshot images,
 * the legacy single image, and an image background. Server-safe — depends only
 * on schema types, no storage/client imports. Tolerant of malformed docs so it
 * can run on raw rows during deletion cleanup.
 */
export function collectBlobKeys(doc: unknown): string[] {
  const keys: string[] = [];
  if (!doc || typeof doc !== 'object') return keys;
  const d = doc as Partial<ScreenstylerDoc>;

  if (d.content?.image?.blobKey) keys.push(d.content.image.blobKey);
  for (const s of d.content?.screenshots ?? []) {
    if (s?.image?.blobKey) keys.push(s.image.blobKey);
  }
  if (d.canvas?.background?.type === 'image' && d.canvas.background.ref?.blobKey) {
    keys.push(d.canvas.background.ref.blobKey);
  }

  return keys;
}
