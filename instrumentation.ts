// Runs once per server instance, before any request is served. We use it to
// apply pending Postgres migrations on container startup, so a fresh deploy is
// schema-ready without a manual step. SQLite and PGlite modes apply their own
// schema lazily via ensureSchema(), so this path only covers a real Neon
// (Postgres) deployment.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (!process.env.NEON_DATABASE_URL) return;
  const { runNeonMigrations } = await import('./lib/db/migrate-neon');
  await runNeonMigrations();
}
