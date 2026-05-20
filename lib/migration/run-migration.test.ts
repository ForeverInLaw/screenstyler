import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runMigration, MIGRATED_FLAG } from './run-migration';
import { LocalProjectStore } from '@/lib/storage/local-project-store';
import { IdbBlobStore } from '@/lib/storage/idb-blob-store';
import { createBlankDoc } from '@/lib/document/factory';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

function mockFetchSequence(...responses: Response[]): void {
  let i = 0;
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => responses[i++]);
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
});
