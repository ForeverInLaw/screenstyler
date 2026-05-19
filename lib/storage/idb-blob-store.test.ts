import { describe, it, expect } from 'vitest';
import { IdbBlobStore } from './idb-blob-store';

describe('IdbBlobStore', () => {
  it('stores, reads, and removes a blob', async () => {
    const store = new IdbBlobStore();
    const blob = new Blob(['hello'], { type: 'text/plain' });
    await store.put('k1', blob);

    const got = await store.get('k1');
    expect(got).toBeInstanceOf(Blob);
    expect(await got!.text()).toBe('hello');
    expect(got!.type).toBe('text/plain');

    await store.remove('k1');
    expect(await store.get('k1')).toBeUndefined();
  });
});
