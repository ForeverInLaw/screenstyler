import { openDB, type IDBPDatabase } from 'idb';
import { screenstylerDocSchema, CorruptDocumentError, type ScreenstylerDoc } from '../document/schema';
import type { ProjectMeta, ProjectStore } from './types';

const INDEX_KEY = 'screenstyler:projects';
const docKey = (id: string) => `screenstyler:doc:${id}`;
const DB_NAME = 'screenstyler';
const PROJECTS_STORE = 'projects';

function isLocalStorageAvailable(): boolean {
  try {
    const key = '__test_local_storage__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

class LocalStorageProjectStore implements ProjectStore {
  async list(): Promise<ProjectMeta[]> {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as ProjectMeta[]) : [];
  }

  async load(id: string): Promise<ScreenstylerDoc> {
    const raw = localStorage.getItem(docKey(id));
    if (!raw) throw new Error(`PROJECT_NOT_FOUND:${id}`);
    try {
      return screenstylerDocSchema.parse(JSON.parse(raw));
    } catch (err) {
      throw new CorruptDocumentError(raw, err as Error);
    }
  }

  async create(name: string, doc: ScreenstylerDoc): Promise<string> {
    const id = crypto.randomUUID();
    const now = Date.now();
    this.writeDoc(id, doc);
    const meta: ProjectMeta = { id, name, thumbnailKey: null, createdAt: now, updatedAt: now };
    this.writeIndex([meta, ...(await this.list())]);
    return id;
  }

  async save(id: string, doc: ScreenstylerDoc, meta?: Partial<ProjectMeta>): Promise<void> {
    this.writeDoc(id, doc);
    const index = await this.list();
    this.writeIndex(
      index.map((m) => (m.id === id ? { ...m, ...meta, updatedAt: Date.now() } : m)),
    );
  }

  async remove(id: string): Promise<void> {
    localStorage.removeItem(docKey(id));
    this.writeIndex((await this.list()).filter((m) => m.id !== id));
  }

  private writeDoc(id: string, doc: ScreenstylerDoc): void {
    try {
      localStorage.setItem(docKey(id), JSON.stringify(doc));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        throw new Error('STORAGE_FULL');
      }
      throw err;
    }
  }

  private writeIndex(index: ProjectMeta[]): void {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  }
}

class IdbProjectStore implements ProjectStore {
  private async db(): Promise<IDBPDatabase> {
    return openDB(DB_NAME, 2, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('blobs')) {
          database.createObjectStore('blobs');
        }
        if (!database.objectStoreNames.contains(PROJECTS_STORE)) {
          database.createObjectStore(PROJECTS_STORE);
        }
      },
    });
  }

  async list(): Promise<ProjectMeta[]> {
    const database = await this.db();
    const raw = await database.get(PROJECTS_STORE, INDEX_KEY);
    return raw ? (JSON.parse(raw) as ProjectMeta[]) : [];
  }

  async load(id: string): Promise<ScreenstylerDoc> {
    const database = await this.db();
    const raw = await database.get(PROJECTS_STORE, docKey(id));
    if (!raw) throw new Error(`PROJECT_NOT_FOUND:${id}`);
    try {
      return screenstylerDocSchema.parse(JSON.parse(raw));
    } catch (err) {
      throw new CorruptDocumentError(raw, err as Error);
    }
  }

  async create(name: string, doc: ScreenstylerDoc): Promise<string> {
    const id = crypto.randomUUID();
    const now = Date.now();
    await this.writeDoc(id, doc);
    const meta: ProjectMeta = { id, name, thumbnailKey: null, createdAt: now, updatedAt: now };
    await this.writeIndex([meta, ...(await this.list())]);
    return id;
  }

  async save(id: string, doc: ScreenstylerDoc, meta?: Partial<ProjectMeta>): Promise<void> {
    await this.writeDoc(id, doc);
    const index = await this.list();
    await this.writeIndex(
      index.map((m) => (m.id === id ? { ...m, ...meta, updatedAt: Date.now() } : m)),
    );
  }

  async remove(id: string): Promise<void> {
    const database = await this.db();
    await database.delete(PROJECTS_STORE, docKey(id));
    await this.writeIndex((await this.list()).filter((m) => m.id !== id));
  }

  private async writeDoc(id: string, doc: ScreenstylerDoc): Promise<void> {
    const database = await this.db();
    try {
      await database.put(PROJECTS_STORE, JSON.stringify(doc), docKey(id));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        throw new Error('STORAGE_FULL');
      }
      throw err;
    }
  }

  private async writeIndex(index: ProjectMeta[]): Promise<void> {
    const database = await this.db();
    await database.put(PROJECTS_STORE, JSON.stringify(index), INDEX_KEY);
  }
}

export class LocalProjectStore implements ProjectStore {
  private delegate: ProjectStore | null = null;

  private getStore(): ProjectStore {
    if (this.delegate) return this.delegate;
    if (isLocalStorageAvailable()) {
      this.delegate = new LocalStorageProjectStore();
    } else {
      this.delegate = new IdbProjectStore();
    }
    return this.delegate;
  }

  list(): Promise<ProjectMeta[]> {
    return this.getStore().list();
  }

  load(id: string): Promise<ScreenstylerDoc> {
    return this.getStore().load(id);
  }

  create(name: string, doc: ScreenstylerDoc): Promise<string> {
    return this.getStore().create(name, doc);
  }

  save(id: string, doc: ScreenstylerDoc, meta?: Partial<ProjectMeta>): Promise<void> {
    return this.getStore().save(id, doc, meta);
  }

  remove(id: string): Promise<void> {
    return this.getStore().remove(id);
  }
}
