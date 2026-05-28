import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { POST } from './route';
import { setupTestDb, seedUser, mockSession } from '@/lib/test/auth-fixture';

vi.mock('@/lib/blob/r2-server', () => ({
  signPut: vi.fn(async (key: string) => `https://r2/${key}?sig=put`),
  signGet: vi.fn(async (key: string) => `https://r2/${key}?sig=get`),
}));

beforeAll(() => {
  process.env.R2_ENDPOINT = 'http://test';
  process.env.R2_ACCESS_KEY_ID = 'test';
  process.env.R2_SECRET_ACCESS_KEY = 'test';
});

beforeEach(setupTestDb);

function body(b: object): Request {
  return new Request('http://x', {
    method: 'POST',
    body: JSON.stringify(b),
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/blobs/sign', () => {
  it('401 unauthenticated', async () => {
    mockSession(null);
    const res = await POST(body({ key: 'users/x/y', op: 'put', contentType: 'image/png' }));
    expect(res.status).toBe(401);
  });

  it('403 when key prefix does not match the session user', async () => {
    const u = await seedUser();
    mockSession(u);
    const res = await POST(body({ key: 'users/other/x', op: 'put', contentType: 'image/png' }));
    expect(res.status).toBe(403);
  });

  it('returns a signed put URL for an owned key', async () => {
    const u = await seedUser();
    mockSession(u);
    const res = await POST(body({ key: `users/${u.id}/img-1`, op: 'put', contentType: 'image/png' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toContain('sig=put');
  });

  it('returns a signed get URL', async () => {
    const u = await seedUser();
    mockSession(u);
    const res = await POST(body({ key: `users/${u.id}/img-1`, op: 'get' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toContain('sig=get');
  });
});
