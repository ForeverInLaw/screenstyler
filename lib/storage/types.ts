import type { ScreenstylerDoc } from '../document/schema';

export type ProjectMeta = {
  id: string;
  name: string;
  thumbnailKey: string | null;
  createdAt: number;
  updatedAt: number;
};

export interface ProjectStore {
  list(): Promise<ProjectMeta[]>;
  load(id: string): Promise<ScreenstylerDoc>;
  create(name: string, doc: ScreenstylerDoc): Promise<string>;
  save(id: string, doc: ScreenstylerDoc, meta?: Partial<ProjectMeta>): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface BlobStore {
  put(key: string, blob: Blob): Promise<void>;
  get(key: string): Promise<Blob | undefined>;
  remove(key: string): Promise<void>;
}
