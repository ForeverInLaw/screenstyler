import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { join } from 'node:path';

// Applies any unapplied SQL migrations to the Neon database and records them in
// the drizzle migrations table, so repeated startups are no-ops. Uses
// drizzle-orm directly because drizzle-kit is a dev dependency and is absent
// from the production image.
//
// The Neon HTTP driver has no transactions: a migration that fails partway is
// not rolled back. Keep migrations forward-only and idempotent where possible.
export async function runNeonMigrations(): Promise<void> {
  const url = process.env.NEON_DATABASE_URL;
  if (!url) return;
  const db = drizzle(neon(url));
  await migrate(db, { migrationsFolder: join(process.cwd(), 'lib/db/migrations') });
}
