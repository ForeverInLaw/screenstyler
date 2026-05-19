import { screenstylerDocSchema, type ScreenstylerDoc } from '../document/schema';
import type { ProjectMeta, ProjectStore } from './types';

const INDEX_KEY = 'screenstyler:projects';
const docKey = (id: string) => `screenstyler:doc:${id}`;

export class LocalProjectStore implements ProjectStore {
  async list(): Promise<ProjectMeta[]> {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as ProjectMeta[]) : [];
  }

  async load(id: string): Promise<ScreenstylerDoc> {
    const raw = localStorage.getItem(docKey(id));
    if (!raw) throw new Error(`PROJECT_NOT_FOUND:${id}`);
    return screenstylerDocSchema.parse(JSON.parse(raw));
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
