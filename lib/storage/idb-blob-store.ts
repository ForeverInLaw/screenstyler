import { openDB, type IDBPDatabase } from 'idb';
import type { BlobStore } from './types';

const DB_NAME = 'screenstyler';
const STORE = 'blobs';

let dbPromise: Promise<IDBPDatabase> | null = null;

function db(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 2, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE)) {
          database.createObjectStore(STORE);
        }
        if (!database.objectStoreNames.contains('projects')) {
          database.createObjectStore('projects');
        }
      },
    });
  }
  return dbPromise;
}

// Blobs are serialized as { type, buffer } instead of stored raw because
// fake-indexeddb (used in jsdom tests) does not round-trip Blob via structured
// clone — it returns {} — so we must reconstruct the Blob on read ourselves.
type BlobRecord = { type: string; buffer: ArrayBuffer };

export class IdbBlobStore implements BlobStore {
  async put(key: string, blob: Blob): Promise<void> {
    const record: BlobRecord = { type: blob.type, buffer: await blob.arrayBuffer() };
    await (await db()).put(STORE, record, key);
  }
  async get(key: string): Promise<Blob | undefined> {
    const record: BlobRecord | undefined = await (await db()).get(STORE, key);
    if (record === undefined) return undefined;
    return new Blob([record.buffer], { type: record.type });
  }
  async remove(key: string): Promise<void> {
    await (await db()).delete(STORE, key);
  }
}
