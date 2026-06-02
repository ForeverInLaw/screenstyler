import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { GET, PATCH, DELETE } from './route';
import { setupTestDb, seedUser, mockSession } from '@/lib/test/auth-fixture';
import { getDb } from '@/lib/db/client';
import { projects } from '@/lib/db/active-schema';

vi.mock('@/lib/blob/r2-server', () => ({
  signPut: vi.fn(async (key: string) => `https://r2/${key}?sig=put`),
  signGet: vi.fn(async (key: string) => `https://r2/${key}?sig=get`),
  deleteObject: vi.fn(async () => undefined),
}));

beforeAll(() => {
  process.env.R2_ENDPOINT = 'http://test';
  process.env.R2_ACCESS_KEY_ID = 'test';
  process.env.R2_SECRET_ACCESS_KEY = 'test';
});

beforeEach(setupTestDb);

async function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('project [id] routes', () => {
  it('GET 401 unauthenticated', async () => {
    mockSession(null);
    const res = await GET(new Request('http://x'), await ctx('x'));
    expect(res.status).toBe(401);
  });

  it('GET 404 for a foreign project', async () => {
    const a = await seedUser('a@a');
    const b = await seedUser('b@b');
    const [p] = await getDb().insert(projects).values({ userId: b.id, name: 'P', doc: {} }).returning();
    mockSession(a);
    const res = await GET(new Request('http://x'), await ctx(p.id));
    expect(res.status).toBe(404);
  });

  it('GET returns the doc for an owned project', async () => {
    const u = await seedUser();
    const [p] = await getDb().insert(projects).values({ userId: u.id, name: 'P', doc: { v: 7 } }).returning();
    mockSession(u);
    const res = await GET(new Request('http://x'), await ctx(p.id));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ v: 7 });
  });

  it('PATCH updates the doc', async () => {
    const u = await seedUser();
    const [p] = await getDb().insert(projects).values({ userId: u.id, name: 'P', doc: { v: 1 } }).returning();
    mockSession(u);
    const body = JSON.stringify({ doc: { v: 2 } });
    const res = await PATCH(new Request('http://x', {
      method: 'PATCH', body, headers: { 'content-type': 'application/json' },
    }), await ctx(p.id));
    expect(res.status).toBe(200);

    const loaded = await (await GET(new Request('http://x'), await ctx(p.id))).json();
    expect(loaded).toEqual({ v: 2 });
  });

  it('PATCH 403 when the doc references another tenant blob', async () => {
    const attacker = await seedUser('attacker@a');
    const victim = await seedUser('victim@v');
    const [p] = await getDb()
      .insert(projects)
      .values({ userId: attacker.id, name: 'P', doc: { v: 1 } })
      .returning();
    mockSession(attacker);
    const body = JSON.stringify({
      doc: { content: { image: { blobKey: `users/${victim.id}/secret.png` } } },
    });
    const res = await PATCH(new Request('http://x', {
      method: 'PATCH', body, headers: { 'content-type': 'application/json' },
    }), await ctx(p.id));
    expect(res.status).toBe(403);
    // The original doc must be untouched.
    const loaded = await (await GET(new Request('http://x'), await ctx(p.id))).json();
    expect(loaded).toEqual({ v: 1 });
  });

  it('PATCH 403 for a foreign thumbnailKey', async () => {
    const attacker = await seedUser('attacker@a');
    const victim = await seedUser('victim@v');
    const [p] = await getDb()
      .insert(projects)
      .values({ userId: attacker.id, name: 'P', doc: { v: 1 } })
      .returning();
    mockSession(attacker);
    const body = JSON.stringify({ meta: { thumbnailKey: `users/${victim.id}/thumb.png` } });
    const res = await PATCH(new Request('http://x', {
      method: 'PATCH', body, headers: { 'content-type': 'application/json' },
    }), await ctx(p.id));
    expect(res.status).toBe(403);
  });

  it('PATCH 404 for a foreign project', async () => {
    const a = await seedUser('a@a');
    const b = await seedUser('b@b');
    const [p] = await getDb().insert(projects).values({ userId: b.id, name: 'P', doc: {} }).returning();
    mockSession(a);
    const res = await PATCH(new Request('http://x', {
      method: 'PATCH', body: JSON.stringify({ doc: {} }),
      headers: { 'content-type': 'application/json' },
    }), await ctx(p.id));
    expect(res.status).toBe(404);
  });

  it('DELETE removes the project', async () => {
    const u = await seedUser();
    const [p] = await getDb().insert(projects).values({ userId: u.id, name: 'P', doc: {} }).returning();
    mockSession(u);
    const del = await DELETE(new Request('http://x', { method: 'DELETE' }), await ctx(p.id));
    expect(del.status).toBe(200);
    const after = await GET(new Request('http://x'), await ctx(p.id));
    expect(after.status).toBe(404);
  });

  it('DELETE calls deleteObject for owned R2 keys', async () => {
    const { deleteObject } = await import('@/lib/blob/r2-server');
    const u = await seedUser();
    const [p] = await getDb()
      .insert(projects)
      .values({
        userId: u.id,
        name: 'P',
        doc: {},
        sourceImageKey: `users/${u.id}/img.png`,
        thumbnailKey: `users/${u.id}/thumb.png`,
      })
      .returning();
    mockSession(u);
    const del = await DELETE(new Request('http://x', { method: 'DELETE' }), await ctx(p.id));
    expect(del.status).toBe(200);
    // Give fire-and-forget promises a tick to resolve.
    await new Promise((r) => setTimeout(r, 0));
    expect(deleteObject).toHaveBeenCalledWith(`users/${u.id}/img.png`);
    expect(deleteObject).toHaveBeenCalledWith(`users/${u.id}/thumb.png`);
  });

  it('DELETE never deletes blob keys owned by another tenant', async () => {
    const { deleteObject } = await import('@/lib/blob/r2-server');
    vi.mocked(deleteObject).mockClear();
    const victim = await seedUser('victim@v');
    const attacker = await seedUser('attacker@a');
    // Attacker's project references the victim's blobs in its (user-controlled)
    // doc, sourceImageKey, and thumbnailKey.
    const foreignKey = `users/${victim.id}/secret.png`;
    const [p] = await getDb()
      .insert(projects)
      .values({
        userId: attacker.id,
        name: 'P',
        doc: { content: { image: { blobKey: foreignKey } } },
        sourceImageKey: foreignKey,
        thumbnailKey: foreignKey,
      })
      .returning();
    mockSession(attacker);
    const del = await DELETE(new Request('http://x', { method: 'DELETE' }), await ctx(p.id));
    expect(del.status).toBe(200);
    await new Promise((r) => setTimeout(r, 0));
    expect(deleteObject).not.toHaveBeenCalledWith(foreignKey);
  });
});
