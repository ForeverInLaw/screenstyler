import { drizzle as drizzleNeon, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePglite, type PgliteDatabase } from 'drizzle-orm/pglite';
import { neon } from '@neondatabase/serverless';
import { PGlite } from '@electric-sql/pglite';
import * as schema from './schema';

type Db = NeonHttpDatabase<typeof schema> | PgliteDatabase<typeof schema>;

let cached: Db | null = null;
let schemaReady: Promise<void> | null = null;

function isPgliteMode(): boolean {
  return process.env.NODE_ENV === 'test' || !process.env.NEON_DATABASE_URL;
}

export function getDb(): Db {
  if (cached) return cached;
  const url = process.env.NEON_DATABASE_URL;
  if (process.env.NODE_ENV === 'test' || !url) {
    cached = drizzlePglite(new PGlite(), { schema });
  } else {
    cached = drizzleNeon(neon(url), { schema });
  }
  return cached;
}

export function ensureSchema(): Promise<void> {
  if (!isPgliteMode()) return Promise.resolve();
  if (!schemaReady) {
    // Lazy-import to avoid circular deps (migrate -> getDb).
    schemaReady = (async () => {
      const { applyMigrations } = await import('./migrate');
      await applyMigrations();
    })();
  }
  return schemaReady;
}

export function resetDbForTests(): void {
  cached = null;
  schemaReady = null;
}

/** Call after manually applying migrations in test setup to prevent ensureSchema() from double-migrating. */
export function markSchemaReadyForTests(): void {
  schemaReady = Promise.resolve();
}

export { schema };
