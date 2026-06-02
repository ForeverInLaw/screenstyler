import { screenstylerDocSchema, CorruptDocumentError, type ScreenstylerDoc } from '@/lib/document/schema';
import type { ProjectMeta, ProjectStore } from './types';

async function http<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { credentials: 'include', ...init });
  if (res.status === 404) throw new Error(`PROJECT_NOT_FOUND:${input}`);
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export class CloudProjectStore implements ProjectStore {
  async list(): Promise<ProjectMeta[]> {
    return http<ProjectMeta[]>('/api/projects');
  }
  async load(id: string): Promise<ScreenstylerDoc> {
    const raw = await http<unknown>(`/api/projects/${id}`);
    try {
      return screenstylerDocSchema.parse(raw);
    } catch (err) {
      throw new CorruptDocumentError(JSON.stringify(raw), err as Error);
    }
  }
  async create(name: string, doc: ScreenstylerDoc): Promise<string> {
    const { id } = await http<{ id: string }>('/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, doc }),
    });
    return id;
  }
  async save(id: string, doc: ScreenstylerDoc, meta?: Partial<ProjectMeta>): Promise<void> {
    await http<unknown>(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        doc,
        meta: meta ? { name: meta.name, thumbnailKey: meta.thumbnailKey } : undefined,
      }),
    });
  }
  async remove(id: string): Promise<void> {
    await http<unknown>(`/api/projects/${id}`, { method: 'DELETE' });
  }
}
