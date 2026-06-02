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

/**
 * Return the first blob key that provably belongs to a *different* tenant, or
 * null if none do. A key is foreign only when it carries an explicit
 * `users/<id>/` ownership prefix for some `<id>` other than `userId`. Unprefixed
 * legacy keys (e.g. `thumbnail_<projectId>`) aren't attributable to a tenant, so
 * they're left for the storage layer to resolve rather than rejected.
 *
 * Used to reject writes (create/update) that would persist cross-tenant blob
 * references — defense-in-depth behind the ownership-filtered delete sweep.
 */
export function findForeignBlobKey(keys: Iterable<string>, userId: string): string | null {
  const ownPrefix = `users/${userId}/`;
  for (const key of keys) {
    if (key.startsWith('users/') && !key.startsWith(ownPrefix)) return key;
  }
  return null;
}
