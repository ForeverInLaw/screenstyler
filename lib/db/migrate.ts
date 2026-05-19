import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import { getDb } from './client';

export async function applyMigrations(): Promise<void> {
  const dir = join(process.cwd(), 'lib/db/migrations');
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  const db = getDb();
  for (const f of files) {
    const sqlText = readFileSync(join(dir, f), 'utf8');
    const statements = sqlText.split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      await db.execute(sql.raw(stmt));
    }
  }
}
