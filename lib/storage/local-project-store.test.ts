import { describe, it, expect, beforeEach } from 'vitest';
import { LocalProjectStore } from './local-project-store';
import { createBlankDoc } from '../document/factory';

beforeEach(() => localStorage.clear());

describe('LocalProjectStore', () => {
  it('creates, lists, loads, and removes a project', async () => {
    const store = new LocalProjectStore();
    const id = await store.create('My Shot', createBlankDoc());

    const list = await store.list();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id, name: 'My Shot' });

    const loaded = await store.load(id);
    expect(loaded.version).toBe(1);

    await store.remove(id);
    expect(await store.list()).toHaveLength(0);
  });

  it('throws when loading a missing project', async () => {
    const store = new LocalProjectStore();
    await expect(store.load('nope')).rejects.toThrow();
  });

  it('saves an updated document and bumps updatedAt', async () => {
    const store = new LocalProjectStore();
    const id = await store.create('A', createBlankDoc());
    const before = (await store.list())[0].updatedAt;
    await new Promise((r) => setTimeout(r, 2));
    const doc = createBlankDoc();
    doc.content.padding = 200;
    await store.save(id, doc);
    expect((await store.load(id)).content.padding).toBe(200);
    expect((await store.list())[0].updatedAt).toBeGreaterThan(before);
  });

  it('falls back to IndexedDB project storage when localStorage throws', async () => {
    const originalSetItem = localStorage.setItem;
    const originalGetItem = localStorage.getItem;
    const originalRemoveItem = localStorage.removeItem;
    localStorage.setItem = () => { throw new Error('localStorage is blocked'); };
    localStorage.getItem = () => { throw new Error('localStorage is blocked'); };
    localStorage.removeItem = () => { throw new Error('localStorage is blocked'); };

    try {
      const store = new LocalProjectStore();
      const id = await store.create('Idb Project', createBlankDoc());

      const list = await store.list();
      expect(list).toHaveLength(1);
      expect(list[0]).toMatchObject({ id, name: 'Idb Project' });

      const loaded = await store.load(id);
      expect(loaded.version).toBe(1);

      await store.remove(id);
      expect(await store.list()).toHaveLength(0);
    } finally {
      localStorage.setItem = originalSetItem;
      localStorage.getItem = originalGetItem;
      localStorage.removeItem = originalRemoveItem;
    }
  });

  it('throws CorruptDocumentError when loading a corrupted project', async () => {
    const store = new LocalProjectStore();
    const id = 'corrupt-123';
    localStorage.setItem(`screenstyler:doc:${id}`, 'invalid-json-data}');

    await expect(store.load(id)).rejects.toThrow();
    try {
      await store.load(id);
    } catch (err: any) {
      expect(err.isCorrupt).toBe(true);
      expect(err.rawJson).toBe('invalid-json-data}');
    }
  });
});

