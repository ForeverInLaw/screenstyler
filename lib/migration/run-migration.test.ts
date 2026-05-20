import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runMigration, MIGRATED_FLAG } from './run-migration';
import { LocalProjectStore } from '@/lib/storage/local-project-store';
import { IdbBlobStore } from '@/lib/storage/idb-blob-store';
import { createBlankDoc } from '@/lib/document/factory';
import type { ScreenstylerDoc } from '@/lib/document/schema';

// active-stores is imported dynamically inside uploadImage; mock it so the
// cloud BlobStore put() is a no-op in unit tests.
vi.mock('@/lib/storage/active-stores', () => ({
  getBlobStore: vi.fn(() => ({
    put: vi.fn(async () => undefined),
    get: vi.fn(async () => undefined),
    remove: vi.fn(async () => undefined),
  })),
}));

// URL.createObjectURL is not available in jsdom by default.
if (!('createObjectURL' in URL)) {
  Object.defineProperty(URL, 'createObjectURL', {
    value: vi.fn(() => 'blob:mock'),
    writable: true,
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

function mockFetchSequence(...responses: Response[]): void {
  let i = 0;
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => responses[i++]);
}

/** Build a doc that has a content image with the given blobKey. */
function docWithImage(blobKey: string): ScreenstylerDoc {
  return {
    ...createBlankDoc(),
    content: {
      ...createBlankDoc().content,
      image: { id: 'img-1', blobKey, naturalWidth: 100, naturalHeight: 100 },
    },
  };
}

describe('runMigration', () => {
  it('uploads each local project to the cloud and sets the migrated flag', async () => {
    const local = new LocalProjectStore();
    const blob = new IdbBlobStore();
    const id = await local.create('P', createBlankDoc());

    // No image attached; sequence is just the POST to /api/projects
    mockFetchSequence(new Response(JSON.stringify({ id: 'cloud-1' })));

    const result = await runMigration({ local, blob, userId: 'u1' });
    expect(result.migrated).toBe(1);
    expect(result.failed).toBe(0);
    expect(localStorage.getItem(MIGRATED_FLAG)).toBe('1');
    expect((await local.list()).find((p) => p.id === id)).toBeUndefined();
  });

  it('is a no-op when the flag is already set', async () => {
    localStorage.setItem(MIGRATED_FLAG, '1');
    const result = await runMigration({
      local: new LocalProjectStore(),
      blob: new IdbBlobStore(),
      userId: 'u1',
    });
    expect(result.migrated).toBe(0);
  });

  it('keeps a project local if its cloud POST fails', async () => {
    const local = new LocalProjectStore();
    const blob = new IdbBlobStore();
    await local.create('P', createBlankDoc());

    mockFetchSequence(new Response('', { status: 500 }));

    const result = await runMigration({ local, blob, userId: 'u1' });
    expect(result.migrated).toBe(0);
    expect(result.failed).toBe(1);
    expect(localStorage.getItem(MIGRATED_FLAG)).toBeNull();
    expect(await local.list()).toHaveLength(1);
  });

  it('rewrites content.image.blobKey to the prefixed key in the POSTed doc', async () => {
    const local = new LocalProjectStore();
    const blob = new IdbBlobStore();

    // Store a blob so uploadImage can retrieve it.
    const fakeBlob = new Blob(['px'], { type: 'image/png' });
    await blob.put('orig-key', fakeBlob);

    const doc = docWithImage('orig-key');
    await local.create('ImgProject', doc);

    // The upload path calls /api/blobs/sign (from R2BlobStore.put) then a
    // direct PUT.  We've mocked active-stores so getBlobStore().put() is a
    // no-op — uploadImage only calls blob.get (the local IdbBlobStore) and
    // then getBlobStore().put.  No fetch is needed for the upload itself.
    // Only the final /api/projects POST hits fetch.
    let capturedBody: unknown;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('/api/projects')) {
        capturedBody = JSON.parse((init?.body as string) ?? '{}');
        return new Response(JSON.stringify({ id: 'cloud-2' }));
      }
      return new Response('', { status: 404 });
    });

    await runMigration({ local, blob, userId: 'u1' });

    const postedDoc = (capturedBody as { doc: ScreenstylerDoc }).doc;
    expect(postedDoc.content.image?.blobKey).toBe('users/u1/orig-key');
  });
});
