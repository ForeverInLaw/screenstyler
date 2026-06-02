import { drizzle as drizzleNeon, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { neon } from '@neondatabase/serverless';
import { PGlite } from '@electric-sql/pglite';
import Database from 'better-sqlite3';
import * as schema from './schema';
import * as sqliteSchema from './schema-sqlite';

// All three backends (Neon HTTP, PGlite, better-sqlite3) expose the same
// query-builder surface for the queries this app runs. Drizzle types them as
// mutually-incompatible unions, so we pick one canonical type and cast the
// other two to it — the runtime methods are call-compatible. The matching
// table-type collapse lives in active-schema.ts.
type Db = NeonHttpDatabase<typeof schema>;

let cached: Db | null = null;
let schemaReady: Promise<void> | null = null;

export function isSqliteMode(): boolean {
  return !process.env.NEON_DATABASE_URL && process.env.NODE_ENV !== 'test';
}

function isPgliteMode(): boolean {
  return process.env.NODE_ENV === 'test';
}

export function getDb(): Db {
  if (cached) return cached;
  
  if (isSqliteMode()) {
    const dbPath = process.env.DATABASE_URL?.replace('sqlite:', '') ?? './local.db';
    const sqlite = new Database(dbPath);
    cached = drizzleSqlite(sqlite, { schema: sqliteSchema }) as unknown as Db;
    return cached;
  }

  const url = process.env.NEON_DATABASE_URL;
  // Throw only when the variable is absent (undefined) in production at runtime.
  // An explicitly empty string signals an intentional pglite fallback (e.g., e2e).
  // Exempt the Next.js build phase, which evaluates module code without real env vars.
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PHASE !== 'phase-production-build' &&
    url === undefined
  ) {
    throw new Error('NEON_DATABASE_URL is required in production');
  }
  if (isPgliteMode() || !url) {
    cached = drizzlePglite(new PGlite(), { schema }) as unknown as Db;
  } else {
    cached = drizzleNeon(neon(url), { schema });
  }
  return cached;
}


export function ensureSchema(): Promise<void> {
  if (isSqliteMode()) {
    if (!schemaReady) {
      schemaReady = (async () => {
        const { applySQLiteMigrations } = await import('./migrate-sqlite');
        applySQLiteMigrations();
      })();
    }
    return schemaReady;
  }
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
