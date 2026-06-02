import { sql } from 'drizzle-orm';
import { getDb } from './client';

const MIGRATIONS = [
  `-- 0000_initial
CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "email_verified" integer DEFAULT false NOT NULL,
  "name" text,
  "image" text,
  "created_at" integer NOT NULL,
  "updated_at" integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "token" text NOT NULL,
  "expires_at" integer NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "created_at" integer NOT NULL,
  "updated_at" integer NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_idx" ON "sessions" ("token");
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions" ("user_id");

CREATE TABLE IF NOT EXISTS "accounts" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "account_id" text NOT NULL,
  "password" text,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" integer,
  "refresh_token_expires_at" integer,
  "scope" text,
  "created_at" integer NOT NULL,
  "updated_at" integer NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_account_idx" ON "accounts" ("provider_id", "account_id");
CREATE INDEX IF NOT EXISTS "accounts_user_id_idx" ON "accounts" ("user_id");

CREATE TABLE IF NOT EXISTS "verifications" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" integer NOT NULL,
  "created_at" integer NOT NULL
);
CREATE INDEX IF NOT EXISTS "verifications_identifier_idx" ON "verifications" ("identifier");

CREATE TABLE IF NOT EXISTS "projects" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "name" text NOT NULL,
  "doc" text NOT NULL,
  "source_image_key" text,
  "thumbnail_key" text,
  "created_at" integer NOT NULL,
  "updated_at" integer NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS "projects_user_updated_idx" ON "projects" ("user_id", "updated_at" DESC);
`,
];

export function applySQLiteMigrations(): void {
  // getDb() is typed to the canonical (pg) Db; in sqlite mode the instance is a
  // better-sqlite3 driver that exposes synchronous .run(). Narrow to that here.
  const db = getDb() as unknown as { run: (query: ReturnType<typeof sql.raw>) => void };
  for (const migration of MIGRATIONS) {
    const statements = migration.split(';').map((s) => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      db.run(sql.raw(stmt + ';'));
    }
  }
}
