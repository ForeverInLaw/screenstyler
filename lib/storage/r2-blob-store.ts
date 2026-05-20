import type { BlobStore } from './types';

async function sign(key: string, op: 'put' | 'get', contentType?: string): Promise<string> {
  const res = await fetch('/api/blobs/sign', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ key, op, contentType }),
  });
  if (!res.ok) throw new Error(`SIGN_${res.status}`);
  const { url } = (await res.json()) as { url: string };
  return url;
}

export class R2BlobStore implements BlobStore {
  async put(key: string, blob: Blob): Promise<void> {
    const url = await sign(key, 'put', blob.type || 'application/octet-stream');
    const res = await fetch(url, {
      method: 'PUT',
      body: blob,
      headers: { 'content-type': blob.type || 'application/octet-stream' },
    });
    if (!res.ok) throw new Error(`PUT_${res.status}`);
  }

  async get(key: string): Promise<Blob | undefined> {
    const url = await sign(key, 'get');
    const res = await fetch(url);
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error(`GET_${res.status}`);
    return await res.blob();
  }

  async remove(key: string): Promise<void> {
    // v1: deletion happens cascadewise on the server (project DELETE removes
    // the row; a separate cleanup job can remove orphaned objects). Client
    // remove is intentionally a no-op so the BlobStore contract stays the same.
    void key;
  }
}
