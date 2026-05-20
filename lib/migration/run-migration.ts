import type { ProjectStore, BlobStore } from '@/lib/storage/types';
import type { ScreenstylerDoc } from '@/lib/document/schema';

export const MIGRATED_FLAG = 'screenstyler:migrated';

type Args = { local: ProjectStore; blob: BlobStore; userId: string };
type Result = { migrated: number; failed: number };

async function uploadImage(blob: BlobStore, baseKey: string, userId: string): Promise<string | null> {
  const data = await blob.get(baseKey);
  if (!data) return null;
  const newKey = baseKey.startsWith(`users/${userId}/`) ? baseKey : `users/${userId}/${baseKey}`;
  // Send through the currently-active cloud BlobStore — the user is signed in
  // by the time MigrationRunner mounts.
  const { getBlobStore } = await import('@/lib/storage/active-stores');
  await getBlobStore().put(newKey, data);
  return newKey;
}

/**
 * Rewrite all blobKey references inside the doc to use the new prefixed key.
 * Mutates the provided (already-cloned) doc in place.
 */
function rewriteBlobKeys(
  doc: ScreenstylerDoc,
  oldKey: string,
  newKey: string,
): void {
  if (doc.content.image?.blobKey === oldKey) {
    doc.content.image.blobKey = newKey;
  }
  if (doc.canvas.background.type === 'image' && doc.canvas.background.ref.blobKey === oldKey) {
    doc.canvas.background.ref.blobKey = newKey;
  }
}

export async function runMigration({ local, blob, userId }: Args): Promise<Result> {
  if (localStorage.getItem(MIGRATED_FLAG)) return { migrated: 0, failed: 0 };

  const metas = await local.list();
  let migrated = 0;
  let failed = 0;

  for (const meta of metas) {
    try {
      // Clone so we never mutate cached local store objects.
      const doc = structuredClone(await local.load(meta.id)) as ScreenstylerDoc;

      const contentKey = doc.content?.image?.blobKey ?? null;
      const newContentKey = contentKey ? await uploadImage(blob, contentKey, userId) : null;

      // Upload background image if it has a different blobKey from the content image.
      const bg = doc.canvas.background;
      const bgKey = bg.type === 'image' ? bg.ref.blobKey : null;
      let newBgKey: string | null = null;
      if (bgKey) {
        if (bgKey === contentKey && newContentKey) {
          newBgKey = newContentKey;
        } else {
          newBgKey = await uploadImage(blob, bgKey, userId);
        }
      }

      // Rewrite all blobKey references in the doc before posting.
      if (contentKey && newContentKey) {
        rewriteBlobKeys(doc, contentKey, newContentKey);
      }
      if (bgKey && newBgKey && bgKey !== contentKey) {
        rewriteBlobKeys(doc, bgKey, newBgKey);
      }

      const res = await fetch('/api/projects', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: meta.name, doc, sourceImageKey: newContentKey }),
      });
      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      await local.remove(meta.id);
      migrated++;
    } catch (err) {
      console.warn('runMigration: failed to migrate project', meta.id, err);
      failed++;
    }
  }

  if (failed === 0) localStorage.setItem(MIGRATED_FLAG, '1');
  return { migrated, failed };
}
