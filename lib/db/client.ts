import { drizzle as drizzleNeon, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePglite, type PgliteDatabase } from 'drizzle-orm/pglite';
import { neon } from '@neondatabase/serverless';
import { PGlite } from '@electric-sql/pglite';
import * as schema from './schema';

type Db = NeonHttpDatabase<typeof schema> | PgliteDatabase<typeof schema>;

let cached: Db | null = null;

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

export function resetDbForTests(): void {
  cached = null;
}

export { schema };
