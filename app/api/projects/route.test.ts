import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { setupTestDb, seedUser, mockSession } from '@/lib/test/auth-fixture';

beforeEach(setupTestDb);

describe('GET /api/projects', () => {
  it('401 without session', async () => {
    mockSession(null);
    const res = await GET(new Request('http://x/api/projects'));
    expect(res.status).toBe(401);
  });

  it('returns the session user projects (empty initially)', async () => {
    const u = await seedUser();
    mockSession(u);
    const res = await GET(new Request('http://x/api/projects'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});

describe('POST /api/projects', () => {
  it('401 without session', async () => {
    mockSession(null);
    const res = await POST(new Request('http://x/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'P', doc: { version: 1 } }),
      headers: { 'content-type': 'application/json' },
    }));
    expect(res.status).toBe(401);
  });

  it('creates a project and returns its id', async () => {
    const u = await seedUser();
    mockSession(u);
    const body = JSON.stringify({ name: 'P', doc: { version: 1 } });
    const res = await POST(new Request('http://x/api/projects', {
      method: 'POST', body, headers: { 'content-type': 'application/json' },
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(typeof json.id).toBe('string');

    const list = await (await GET(new Request('http://x/api/projects'))).json();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: json.id, name: 'P' });
  });

  it('accepts null sourceImageKey for migrated local projects', async () => {
    const u = await seedUser();
    mockSession(u);
    const body = JSON.stringify({ name: 'Migrated', doc: { version: 1 }, sourceImageKey: null });
    const res = await POST(new Request('http://x/api/projects', {
      method: 'POST', body, headers: { 'content-type': 'application/json' },
    }));
    expect(res.status).toBe(200);
  });

  it('rejects an invalid body with 400', async () => {
    const u = await seedUser();
    mockSession(u);
    const res = await POST(new Request('http://x/api/projects', {
      method: 'POST', body: JSON.stringify({ name: '' }),
      headers: { 'content-type': 'application/json' },
    }));
    expect(res.status).toBe(400);
  });

  it('rejects a doc referencing another tenant blob with 403', async () => {
    const attacker = await seedUser('attacker@a');
    const victim = await seedUser('victim@v');
    mockSession(attacker);
    const body = JSON.stringify({
      name: 'P',
      doc: { content: { image: { blobKey: `users/${victim.id}/secret.png` } } },
    });
    const res = await POST(new Request('http://x/api/projects', {
      method: 'POST', body, headers: { 'content-type': 'application/json' },
    }));
    expect(res.status).toBe(403);
  });

  it('rejects a foreign sourceImageKey with 403', async () => {
    const attacker = await seedUser('attacker@a');
    const victim = await seedUser('victim@v');
    mockSession(attacker);
    const body = JSON.stringify({
      name: 'P', doc: { version: 1 }, sourceImageKey: `users/${victim.id}/img.png`,
    });
    const res = await POST(new Request('http://x/api/projects', {
      method: 'POST', body, headers: { 'content-type': 'application/json' },
    }));
    expect(res.status).toBe(403);
  });

  it('accepts owned and unprefixed legacy keys', async () => {
    const u = await seedUser();
    mockSession(u);
    const body = JSON.stringify({
      name: 'P',
      doc: { content: { image: { blobKey: `users/${u.id}/img.png` } } },
      sourceImageKey: 'thumbnail_legacy',
    });
    const res = await POST(new Request('http://x/api/projects', {
      method: 'POST', body, headers: { 'content-type': 'application/json' },
    }));
    expect(res.status).toBe(200);
  });
});
