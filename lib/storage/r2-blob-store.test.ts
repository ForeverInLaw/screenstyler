// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { R2BlobStore } from './r2-blob-store';

beforeEach(() => vi.restoreAllMocks());

describe('R2BlobStore', () => {
  it('put() requests a presigned URL then PUTs the blob', async () => {
    const f = vi.spyOn(globalThis, 'fetch');
    f.mockResolvedValueOnce(new Response(JSON.stringify({ url: 'https://r2/put', expiresIn: 300 })));
    f.mockResolvedValueOnce(new Response('', { status: 200 }));

    await new R2BlobStore().put('users/u/key', new Blob(['x'], { type: 'image/png' }));
    expect(f.mock.calls[0][0]).toBe('/api/blobs/sign');
    expect(f.mock.calls[1][0]).toBe('https://r2/put');
    expect((f.mock.calls[1][1] as RequestInit).method).toBe('PUT');
  });

  it('get() returns a Blob fetched from the signed URL', async () => {
    const f = vi.spyOn(globalThis, 'fetch');
    f.mockResolvedValueOnce(new Response(JSON.stringify({ url: 'https://r2/get' })));
    f.mockResolvedValueOnce(new Response(new Blob(['hi'], { type: 'image/png' }), { status: 200 }));
    const blob = await new R2BlobStore().get('users/u/key');
    expect(blob).toBeInstanceOf(Blob);
    expect(await blob!.text()).toBe('hi');
  });

  it('get() returns undefined on 404 from R2', async () => {
    const f = vi.spyOn(globalThis, 'fetch');
    f.mockResolvedValueOnce(new Response(JSON.stringify({ url: 'https://r2/get' })));
    f.mockResolvedValueOnce(new Response('', { status: 404 }));
    expect(await new R2BlobStore().get('users/u/key')).toBeUndefined();
  });

  it('remove() is a no-op (server-side cleanup runs cascadewise)', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    await new R2BlobStore().remove('users/u/key');
    expect(spy).not.toHaveBeenCalled();
  });
});
