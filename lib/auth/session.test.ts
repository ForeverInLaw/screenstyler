import { describe, it, expect } from 'vitest';
import { requireSession, unauthorized } from './session';

describe('requireSession', () => {
  it('returns null when no session cookie is present', async () => {
    const req = new Request('http://localhost/api/projects');
    const result = await requireSession(req);
    expect(result).toBeNull();
  });
});

describe('unauthorized', () => {
  it('returns a 401 JSON response', async () => {
    const res = unauthorized();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'UNAUTHORIZED' });
  });
});
