import { vi } from 'vitest';
import { getDb, resetDbForTests } from '@/lib/db/client';
import { applyMigrations } from '@/lib/db/migrate';
import { users } from '@/lib/db/schema';
import * as authServer from '@/lib/auth/server';

export async function setupTestDb(): Promise<void> {
  resetDbForTests();
  await applyMigrations();
}

export async function seedUser(email = 'u@test.local'): Promise<{ id: string; email: string }> {
  const [u] = await getDb().insert(users).values({ email }).returning();
  return { id: u.id, email: u.email };
}

export function mockSession(user: { id: string; email: string } | null) {
  const spy = vi.spyOn(authServer.auth.api, 'getSession');
  if (user) {
    spy.mockResolvedValue({
      user: { id: user.id, email: user.email, emailVerified: true, name: null, image: null },
      session: { id: 's', userId: user.id, token: 't', expiresAt: new Date(Date.now() + 3_600_000) },
    } as unknown as Awaited<ReturnType<typeof authServer.auth.api.getSession>>);
  } else {
    spy.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof authServer.auth.api.getSession>>);
  }
  return spy;
}
