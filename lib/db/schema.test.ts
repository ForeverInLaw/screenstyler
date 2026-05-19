import { describe, it, expect, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { getDb, resetDbForTests } from './client';
import { applyMigrations } from './migrate';
import { users, projects } from './schema';

beforeEach(async () => {
  resetDbForTests();
  await applyMigrations();
});

describe('db schema (pglite round-trip)', () => {
  it('inserts a user and a project and reads them back', async () => {
    const db = getDb();
    const [u] = await db.insert(users).values({ email: 'a@b.c' }).returning();
    expect(u.email).toBe('a@b.c');

    const [p] = await db.insert(projects).values({
      userId: u.id, name: 'P', doc: { version: 1 } as unknown as object,
    }).returning();
    expect(p.userId).toBe(u.id);

    const rows = await db.select().from(projects).where(eq(projects.userId, u.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('P');
  });

  it('exports all required tables', () => {
    // Smoke check kept from the prior seed test.
    expect(users).toBeDefined();
    expect(projects).toBeDefined();
  });
});
