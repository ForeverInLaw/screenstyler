import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudProjectStore } from './cloud-project-store';
import { createBlankDoc } from '@/lib/document/factory';

beforeEach(() => vi.restoreAllMocks());

function mockJsonOnce(value: unknown, status = 200): void {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify(value), {
      status,
      headers: { 'content-type': 'application/json' },
    }),
  );
}

describe('CloudProjectStore', () => {
  it('list() GETs /api/projects and returns the array', async () => {
    mockJsonOnce([{ id: 'a', name: 'A', thumbnailKey: null, createdAt: 1, updatedAt: 2 }]);
    const list = await new CloudProjectStore().list();
    expect(list[0]).toMatchObject({ id: 'a', name: 'A' });
  });

  it('create() POSTs and returns the id', async () => {
    mockJsonOnce({ id: 'new-id' });
    const id = await new CloudProjectStore().create('P', createBlankDoc());
    expect(id).toBe('new-id');
  });

  it('throws PROJECT_NOT_FOUND on 404 load', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('', { status: 404 }));
    await expect(new CloudProjectStore().load('x')).rejects.toThrow(/PROJECT_NOT_FOUND/);
  });

  it('load() validates the document against screenstylerDocSchema', async () => {
    mockJsonOnce(createBlankDoc());
    const doc = await new CloudProjectStore().load('id');
    expect(doc.version).toBe(1);
  });

  it('save() PATCHes the project', async () => {
    mockJsonOnce({});
    const spy = vi.spyOn(globalThis, 'fetch');
    await new CloudProjectStore().save('id-1', createBlankDoc(), { name: 'New name' });
    const [url, init] = spy.mock.calls[0];
    expect(url).toBe('/api/projects/id-1');
    expect((init as RequestInit).method).toBe('PATCH');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.meta).toEqual({ name: 'New name' });
  });

  it('remove() DELETEs the project', async () => {
    mockJsonOnce({});
    const spy = vi.spyOn(globalThis, 'fetch');
    await new CloudProjectStore().remove('id-1');
    expect((spy.mock.calls[0][1] as RequestInit).method).toBe('DELETE');
  });
});
