# Accounts + Cloud Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Layer accounts and cloud storage on top of the SP1 editor: email/password + Google OAuth via Better Auth, per-user projects in Neon Postgres via Drizzle, image blobs in Cloudflare R2 via presigned URLs. Auto-migrate local projects on first sign-in. The editor itself does not change — it consumes the `ProjectStore` / `BlobStore` seam introduced in SP1.

**Architecture:** Next.js 16 Route Handlers as the API; Better Auth manages auth tables and OAuth in the same Neon DB; Drizzle ORM for typed queries and migrations. Cloud implementations of `ProjectStore`/`BlobStore` are swapped in via a module-level pointer (`lib/storage/active-stores.ts`) driven by an `AuthSync` mounted at the app root. Tests use `@electric-sql/pglite` (in-process Postgres) so the suite has no external DB dependency.

**Tech Stack additions:** `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`, `better-auth`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `resend`, `@electric-sql/pglite`, `nodemailer`-free.

**Spec:** `docs/superpowers/specs/2026-05-19-accounts-and-cloud-design.md`.

**Branch:** `feat/accounts-cloud` (already created from `master` at `a683057`).

---

## Phase 0 — Environment scaffold

### Task 1: Install deps, `.env.example`, drizzle config

**Files:**
- Modify: `package.json` (deps)
- Create: `.env.example`
- Create: `drizzle.config.ts`
- Modify: `.gitignore` (add `.env.local`, drizzle output)

- [ ] **Step 1: Install dependencies**

```bash
npm install drizzle-orm @neondatabase/serverless better-auth resend @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install -D drizzle-kit @electric-sql/pglite
```

Use latest of each. If `better-auth` exposes a Drizzle adapter under a separate sub-path, follow its current docs (Context7 if unsure).

- [ ] **Step 2: Create `.env.example`**

```
# Database — Neon in prod, pglite in tests (no value needed for pglite)
NEON_DATABASE_URL=

# Better Auth
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_ENDPOINT=
```

- [ ] **Step 3: Create `drizzle.config.ts`**

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dbCredentials: {
    url: process.env.NEON_DATABASE_URL ?? 'postgresql://invalid',
  },
});
```

- [ ] **Step 4: Update `.gitignore`** — append `.env.local` and `/lib/db/migrations/meta` (drizzle-kit journal noise — keep migrations themselves tracked).

- [ ] **Step 5: Verify builds**

Run: `npm run build` — expected: PASS.
Run: `npm run test` — expected: PASS (no new tests yet).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .env.example drizzle.config.ts .gitignore
git commit -m "chore: add Drizzle, Better Auth, R2, Resend, and pglite dependencies"
```

---

## Phase 1 — Database

### Task 2: Drizzle schema

**Files:**
- Create: `lib/db/schema.ts`
- Test: `lib/db/schema.test.ts`

The schema includes Better Auth's standard tables plus the `projects` domain table.

- [ ] **Step 1: Write failing test**

```ts
// lib/db/schema.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { users, sessions, accounts, verifications, projects } from './schema';
import { sql } from 'drizzle-orm';

let db: ReturnType<typeof drizzle>;

beforeEach(async () => {
  const client = new PGlite();
  db = drizzle(client);
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
  // Drizzle schema must round-trip — create tables directly from the schema for the test.
  // Use drizzle-kit's push helper or hand-write the DDL — see Task 3's migration helper.
});

describe('db schema', () => {
  it('inserts and reads a user + project', async () => {
    // Skeleton — fleshed out in Task 3 when migrations are applied.
    expect(users).toBeDefined();
    expect(projects).toBeDefined();
  });
});
```

This is a TDD seed — the deep behavior test lives in Task 3 after migrations apply.

- [ ] **Step 2: Write the schema**

```ts
// lib/db/schema.ts
import { pgTable, text, timestamp, boolean, uuid, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  emailIdx: uniqueIndex('users_email_idx').on(t.email),
}));

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  tokenIdx: uniqueIndex('sessions_token_idx').on(t.token),
  userIdIdx: index('sessions_user_id_idx').on(t.userId),
}));

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  providerId: text('provider_id').notNull(),
  accountId: text('account_id').notNull(),
  password: text('password'), // hashed; only for email/password
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  providerAccountIdx: uniqueIndex('accounts_provider_account_idx').on(t.providerId, t.accountId),
  userIdIdx: index('accounts_user_id_idx').on(t.userId),
}));

export const verifications = pgTable('verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  identifierIdx: index('verifications_identifier_idx').on(t.identifier),
}));

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  doc: jsonb('doc').notNull(),
  sourceImageKey: text('source_image_key'),
  thumbnailKey: text('thumbnail_key'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userUpdatedIdx: index('projects_user_updated_idx').on(t.userId, t.updatedAt.desc()),
}));
```

Note on Better Auth column names: Better Auth's official Drizzle adapter expects specific column names (e.g. `userId` as a camelCase TypeScript property mapping to `user_id` snake_case). The configuration in Task 4 maps the adapter to this schema. If Better Auth's latest API expects different names, adjust the schema to match what its adapter requires — the schema is the source of truth for the migrations either way.

- [ ] **Step 3: Run vitest** — `npx vitest run lib/db/schema.test.ts` — Expected: PASS (skeleton test). The deep behavior comes in Task 3.

- [ ] **Step 4: Commit**

```bash
git add lib/db/schema.ts lib/db/schema.test.ts
git commit -m "feat: add Drizzle schema for auth tables and projects"
```

---

### Task 3: DB client + migration helper + integration test

**Files:**
- Create: `lib/db/client.ts`
- Create: `lib/db/migrate.ts`
- Update: `lib/db/schema.test.ts` (extend with a real insert/select round-trip using pglite)
- Create: `lib/db/migrations/0000_initial.sql` (generated via `drizzle-kit generate`)

- [ ] **Step 1: Write the DB client**

```ts
// lib/db/client.ts
import { drizzle as drizzleNeon, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePglite, PgliteDatabase } from 'drizzle-orm/pglite';
import { neon } from '@neondatabase/serverless';
import { PGlite } from '@electric-sql/pglite';
import * as schema from './schema';

type Db = NeonHttpDatabase<typeof schema> | PgliteDatabase<typeof schema>;

let cached: Db | null = null;

export function getDb(): Db {
  if (cached) return cached;
  const url = process.env.NEON_DATABASE_URL;
  if (process.env.NODE_ENV === 'test' || !url) {
    const client = new PGlite();
    cached = drizzlePglite(client, { schema });
  } else {
    cached = drizzleNeon(neon(url), { schema });
  }
  return cached;
}

// Test helper — reset the cached DB between tests
export function resetDbForTests(): void {
  cached = null;
}

export { schema };
```

- [ ] **Step 2: Generate the migration**

Run: `npx drizzle-kit generate --name initial`
This produces `lib/db/migrations/0000_<hash>_initial.sql`. Commit the generated SQL.

- [ ] **Step 3: Write a migration helper**

```ts
// lib/db/migrate.ts
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
```

(`--> statement-breakpoint` is drizzle-kit's separator.)

- [ ] **Step 4: Extend schema test with a real round-trip**

```ts
// lib/db/schema.test.ts (replace earlier seed with this)
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
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run lib/db/schema.test.ts` — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/db/client.ts lib/db/migrate.ts lib/db/migrations lib/db/schema.test.ts
git commit -m "feat: add db client (Neon/pglite) and migration helper"
```

---

## Phase 2 — Auth

### Task 4: Better Auth server config

**Files:**
- Create: `lib/auth/server.ts`
- Test: `lib/auth/server.test.ts`

Better Auth's exact API may evolve; if the snippet below doesn't match the installed version, adapt — keep the same exports (`auth`, `getSession`) and capabilities (email/password, Google, email verification via Resend, Drizzle adapter against our schema).

- [ ] **Step 1: Write the failing test**

```ts
// lib/auth/server.test.ts
import { describe, it, expect } from 'vitest';
import { auth } from './server';

describe('auth server', () => {
  it('exports the auth instance', () => {
    expect(auth).toBeDefined();
    expect(typeof auth.handler).toBe('function');
  });
});
```

- [ ] **Step 2: Write the server config**

```ts
// lib/auth/server.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { Resend } from 'resend';
import { getDb } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET ?? 'dev-insecure-secret',
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      if (!resend || !process.env.RESEND_FROM) return;
      await resend.emails.send({
        from: process.env.RESEND_FROM,
        to: user.email,
        subject: 'Reset your Screenstyler password',
        text: `Reset link: ${url}`,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      if (!resend || !process.env.RESEND_FROM) return;
      await resend.emails.send({
        from: process.env.RESEND_FROM,
        to: user.email,
        subject: 'Verify your Screenstyler email',
        text: `Verify link: ${url}`,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },
});

export type Session = typeof auth.$Infer.Session;
```

- [ ] **Step 3: Run test** — `npx vitest run lib/auth/server.test.ts` — Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/auth/server.ts lib/auth/server.test.ts
git commit -m "feat: add Better Auth server config with email and Google"
```

---

### Task 5: Better Auth client + handler route

**Files:**
- Create: `lib/auth/client.ts`
- Create: `app/api/auth/[...all]/route.ts`

- [ ] **Step 1: Write the client**

```ts
// lib/auth/client.ts
'use client';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? '',
});

export const { useSession, signIn, signOut, signUp } = authClient;
```

- [ ] **Step 2: Write the route handler**

```ts
// app/api/auth/[...all]/route.ts
import { auth } from '@/lib/auth/server';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit` — Expected: clean.
Run: `npm run build` — Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add lib/auth/client.ts app/api/auth
git commit -m "feat: add Better Auth client and Next.js handler route"
```

---

### Task 6: `requireSession` server helper

**Files:**
- Create: `lib/auth/session.ts`
- Test: `lib/auth/session.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/auth/session.test.ts
import { describe, it, expect } from 'vitest';
import { requireSession } from './session';

describe('requireSession', () => {
  it('returns null when no session cookie is present', async () => {
    const req = new Request('http://localhost/api/projects');
    const result = await requireSession(req);
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Write the helper**

```ts
// lib/auth/session.ts
import { auth, type Session } from './server';

export async function requireSession(req: Request): Promise<Session | null> {
  const session = await auth.api.getSession({ headers: req.headers });
  return session ?? null;
}

export function unauthorized(): Response {
  return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), {
    status: 401,
    headers: { 'content-type': 'application/json' },
  });
}
```

- [ ] **Step 3: Run test** — Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/auth/session.ts lib/auth/session.test.ts
git commit -m "feat: add requireSession server helper"
```

---

## Phase 3 — API routes

### Task 7: `/api/projects` GET + POST

**Files:**
- Create: `app/api/projects/route.ts`
- Test: `app/api/projects/route.test.ts`
- Create: `lib/test/auth-fixture.ts` (test helper to seed a session + user in pglite)

- [ ] **Step 1: Write the test fixture**

```ts
// lib/test/auth-fixture.ts
import { vi } from 'vitest';
import { getDb, resetDbForTests } from '@/lib/db/client';
import { applyMigrations } from '@/lib/db/migrate';
import { users } from '@/lib/db/schema';
import * as authServer from '@/lib/auth/server';

export async function setupTestDb() {
  resetDbForTests();
  await applyMigrations();
}

export async function seedUser(email = 'u@test.local') {
  const [u] = await getDb().insert(users).values({ email }).returning();
  return u;
}

export function mockSession(user: { id: string; email: string } | null) {
  const spy = vi.spyOn(authServer.auth.api, 'getSession');
  spy.mockResolvedValue(user ? { user, session: { id: 's', userId: user.id } } as any : null);
  return spy;
}
```

- [ ] **Step 2: Write the failing test**

```ts
// app/api/projects/route.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { setupTestDb, seedUser, mockSession } from '@/lib/test/auth-fixture';

beforeEach(setupTestDb);

describe('GET /api/projects', () => {
  it('401 without session', async () => {
    mockSession(null);
    const res = await GET(new Request('http://x/api/projects'));
    expect(res.status).toBe(401);
  });

  it('returns the session user projects', async () => {
    const u = await seedUser();
    mockSession({ id: u.id, email: u.email });
    const res = await GET(new Request('http://x/api/projects'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});

describe('POST /api/projects', () => {
  it('creates a project and returns its id', async () => {
    const u = await seedUser();
    mockSession({ id: u.id, email: u.email });
    const body = JSON.stringify({ name: 'P', doc: { version: 1 } });
    const res = await POST(new Request('http://x/api/projects', { method: 'POST', body, headers: { 'content-type': 'application/json' } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(typeof json.id).toBe('string');

    const list = await (await GET(new Request('http://x/api/projects'))).json();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: json.id, name: 'P' });
  });
});
```

- [ ] **Step 3: Write the route**

```ts
// app/api/projects/route.ts
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { projects } from '@/lib/db/schema';
import { requireSession, unauthorized } from '@/lib/auth/session';

const createBody = z.object({
  name: z.string().min(1),
  doc: z.unknown(),
  sourceImageKey: z.string().optional(),
});

export async function GET(req: Request): Promise<Response> {
  const session = await requireSession(req);
  if (!session) return unauthorized();
  const rows = await getDb()
    .select({
      id: projects.id, name: projects.name, thumbnailKey: projects.thumbnailKey,
      createdAt: projects.createdAt, updatedAt: projects.updatedAt,
    })
    .from(projects)
    .where(eq(projects.userId, session.user.id))
    .orderBy(desc(projects.updatedAt));
  return Response.json(rows.map((r) => ({
    id: r.id, name: r.name, thumbnailKey: r.thumbnailKey,
    createdAt: r.createdAt.getTime(), updatedAt: r.updatedAt.getTime(),
  })));
}

export async function POST(req: Request): Promise<Response> {
  const session = await requireSession(req);
  if (!session) return unauthorized();
  const parsed = createBody.safeParse(await req.json());
  if (!parsed.success) return new Response('bad request', { status: 400 });
  const [row] = await getDb().insert(projects).values({
    userId: session.user.id,
    name: parsed.data.name,
    doc: parsed.data.doc as object,
    sourceImageKey: parsed.data.sourceImageKey ?? null,
  }).returning({ id: projects.id });
  return Response.json({ id: row.id });
}
```

- [ ] **Step 4: Run tests** — Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add app/api/projects/route.ts app/api/projects/route.test.ts lib/test/auth-fixture.ts
git commit -m "feat: add /api/projects list and create endpoints"
```

---

### Task 8: `/api/projects/[id]` GET + PATCH + DELETE

**Files:**
- Create: `app/api/projects/[id]/route.ts`
- Test: `app/api/projects/[id]/route.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// app/api/projects/[id]/route.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from './route';
import { setupTestDb, seedUser, mockSession } from '@/lib/test/auth-fixture';
import { getDb } from '@/lib/db/client';
import { projects } from '@/lib/db/schema';

beforeEach(setupTestDb);

async function ctx(id: string) { return { params: Promise.resolve({ id }) }; }

describe('project [id] routes', () => {
  it('GET 401 unauthenticated', async () => {
    mockSession(null);
    const res = await GET(new Request('http://x/api/projects/x'), await ctx('x'));
    expect(res.status).toBe(401);
  });

  it('GET 404 for foreign project', async () => {
    const u = await seedUser('a@a');
    const v = await seedUser('b@b');
    const [p] = await getDb().insert(projects).values({ userId: v.id, name: 'P', doc: {} }).returning();
    mockSession({ id: u.id, email: u.email });
    const res = await GET(new Request('http://x'), await ctx(p.id));
    expect(res.status).toBe(404);
  });

  it('PATCH updates the doc and bumps updatedAt', async () => {
    const u = await seedUser();
    const [p] = await getDb().insert(projects).values({ userId: u.id, name: 'P', doc: { v: 1 } }).returning();
    mockSession({ id: u.id, email: u.email });
    const body = JSON.stringify({ doc: { v: 2 } });
    const res = await PATCH(new Request('http://x', { method: 'PATCH', body, headers: { 'content-type': 'application/json' } }), await ctx(p.id));
    expect(res.status).toBe(200);

    const loaded = await (await GET(new Request('http://x'), await ctx(p.id))).json();
    expect(loaded).toEqual({ v: 2 });
  });

  it('DELETE removes the project', async () => {
    const u = await seedUser();
    const [p] = await getDb().insert(projects).values({ userId: u.id, name: 'P', doc: {} }).returning();
    mockSession({ id: u.id, email: u.email });
    const res = await DELETE(new Request('http://x', { method: 'DELETE' }), await ctx(p.id));
    expect(res.status).toBe(200);

    const res2 = await GET(new Request('http://x'), await ctx(p.id));
    expect(res2.status).toBe(404);
  });
});
```

- [ ] **Step 2: Write the route**

```ts
// app/api/projects/[id]/route.ts
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { projects } from '@/lib/db/schema';
import { requireSession, unauthorized } from '@/lib/auth/session';

const patchBody = z.object({
  doc: z.unknown().optional(),
  meta: z.object({ name: z.string().min(1).optional() }).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx): Promise<Response> {
  const session = await requireSession(req);
  if (!session) return unauthorized();
  const { id } = await ctx.params;
  const [row] = await getDb().select({ doc: projects.doc }).from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)));
  if (!row) return new Response('not found', { status: 404 });
  return Response.json(row.doc);
}

export async function PATCH(req: Request, ctx: Ctx): Promise<Response> {
  const session = await requireSession(req);
  if (!session) return unauthorized();
  const { id } = await ctx.params;
  const parsed = patchBody.safeParse(await req.json());
  if (!parsed.success) return new Response('bad request', { status: 400 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.doc !== undefined) updates.doc = parsed.data.doc;
  if (parsed.data.meta?.name) updates.name = parsed.data.meta.name;

  const result = await getDb().update(projects).set(updates)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id))).returning({ id: projects.id });
  if (result.length === 0) return new Response('not found', { status: 404 });
  return Response.json({});
}

export async function DELETE(req: Request, ctx: Ctx): Promise<Response> {
  const session = await requireSession(req);
  if (!session) return unauthorized();
  const { id } = await ctx.params;
  const result = await getDb().delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id))).returning({ id: projects.id });
  if (result.length === 0) return new Response('not found', { status: 404 });
  return Response.json({});
}
```

- [ ] **Step 3: Run tests** — Expected: PASS (4 tests).

- [ ] **Step 4: Commit**

```bash
git add app/api/projects/[id]
git commit -m "feat: add /api/projects/[id] load, save, delete endpoints"
```

---

### Task 9: `/api/blobs/sign` presigned URL endpoint

**Files:**
- Create: `lib/blob/r2-server.ts`
- Create: `app/api/blobs/sign/route.ts`
- Test: `app/api/blobs/sign/route.test.ts`

- [ ] **Step 1: Write the server R2 client**

```ts
// lib/blob/r2-server.ts
import { S3Client } from '@aws-sdk/client-s3';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function makeClient(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
  });
}

const bucket = () => process.env.R2_BUCKET ?? 'screenstyler';

export async function signPut(key: string, contentType: string, expiresIn = 300): Promise<string> {
  return getSignedUrl(makeClient(), new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }), { expiresIn });
}

export async function signGet(key: string, expiresIn = 300): Promise<string> {
  return getSignedUrl(makeClient(), new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn });
}
```

- [ ] **Step 2: Write the failing test**

```ts
// app/api/blobs/sign/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { mockSession, seedUser, setupTestDb } from '@/lib/test/auth-fixture';

vi.mock('@/lib/blob/r2-server', () => ({
  signPut: vi.fn(async (key: string) => `https://r2/${key}?sig=put`),
  signGet: vi.fn(async (key: string) => `https://r2/${key}?sig=get`),
}));

beforeEach(setupTestDb);

function body(b: object) {
  return new Request('http://x', { method: 'POST', body: JSON.stringify(b), headers: { 'content-type': 'application/json' } });
}

describe('POST /api/blobs/sign', () => {
  it('401 unauthenticated', async () => {
    mockSession(null);
    const res = await POST(body({ key: 'users/x/y', op: 'put', contentType: 'image/png' }));
    expect(res.status).toBe(401);
  });

  it('403 when key prefix does not match the session user', async () => {
    const u = await seedUser();
    mockSession({ id: u.id, email: u.email });
    const res = await POST(body({ key: 'users/other/x', op: 'put', contentType: 'image/png' }));
    expect(res.status).toBe(403);
  });

  it('returns a signed put URL for an owned key', async () => {
    const u = await seedUser();
    mockSession({ id: u.id, email: u.email });
    const res = await POST(body({ key: `users/${u.id}/img-1`, op: 'put', contentType: 'image/png' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toContain('sig=put');
  });
});
```

- [ ] **Step 3: Write the route**

```ts
// app/api/blobs/sign/route.ts
import { z } from 'zod';
import { requireSession, unauthorized } from '@/lib/auth/session';
import { signGet, signPut } from '@/lib/blob/r2-server';

const body = z.object({
  key: z.string().min(1),
  op: z.enum(['put', 'get']),
  contentType: z.string().optional(),
});

export async function POST(req: Request): Promise<Response> {
  const session = await requireSession(req);
  if (!session) return unauthorized();
  const parsed = body.safeParse(await req.json());
  if (!parsed.success) return new Response('bad request', { status: 400 });

  const prefix = `users/${session.user.id}/`;
  if (!parsed.data.key.startsWith(prefix)) {
    return new Response('forbidden', { status: 403 });
  }

  const url = parsed.data.op === 'put'
    ? await signPut(parsed.data.key, parsed.data.contentType ?? 'application/octet-stream')
    : await signGet(parsed.data.key);
  return Response.json({ url, expiresIn: 300 });
}
```

- [ ] **Step 4: Run tests** — Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/blob app/api/blobs
git commit -m "feat: add R2 presigned URL endpoint scoped by user prefix"
```

---

## Phase 4 — Cloud client stores

### Task 10: `CloudProjectStore`

**Files:**
- Create: `lib/storage/cloud-project-store.ts`
- Test: `lib/storage/cloud-project-store.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/storage/cloud-project-store.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudProjectStore } from './cloud-project-store';
import { createBlankDoc } from '@/lib/document/factory';

beforeEach(() => vi.restoreAllMocks());

function mockJsonOnce(value: unknown, status = 200) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } }),
  );
}

describe('CloudProjectStore', () => {
  it('list() GETs /api/projects', async () => {
    mockJsonOnce([{ id: 'a', name: 'A', thumbnailKey: null, createdAt: 1, updatedAt: 2 }]);
    const list = await new CloudProjectStore().list();
    expect(list[0]).toMatchObject({ id: 'a', name: 'A' });
  });

  it('create() POSTs and returns id', async () => {
    mockJsonOnce({ id: 'new-id' });
    const id = await new CloudProjectStore().create('P', createBlankDoc());
    expect(id).toBe('new-id');
  });

  it('throws PROJECT_NOT_FOUND on 404 load', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('', { status: 404 }));
    await expect(new CloudProjectStore().load('x')).rejects.toThrow(/PROJECT_NOT_FOUND/);
  });
});
```

- [ ] **Step 2: Write the store**

```ts
// lib/storage/cloud-project-store.ts
import { screenstylerDocSchema, type ScreenstylerDoc } from '@/lib/document/schema';
import type { ProjectMeta, ProjectStore } from './types';

async function http<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { credentials: 'include', ...init });
  if (res.status === 404) throw new Error(`PROJECT_NOT_FOUND:${input}`);
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  return res.status === 204 ? (undefined as T) : (await res.json() as T);
}

export class CloudProjectStore implements ProjectStore {
  async list(): Promise<ProjectMeta[]> {
    return http<ProjectMeta[]>('/api/projects');
  }
  async load(id: string): Promise<ScreenstylerDoc> {
    const raw = await http<unknown>(`/api/projects/${id}`);
    return screenstylerDocSchema.parse(raw);
  }
  async create(name: string, doc: ScreenstylerDoc): Promise<string> {
    const { id } = await http<{ id: string }>('/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, doc }),
    });
    return id;
  }
  async save(id: string, doc: ScreenstylerDoc, meta?: Partial<ProjectMeta>): Promise<void> {
    await http<unknown>(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ doc, meta: meta?.name ? { name: meta.name } : undefined }),
    });
  }
  async remove(id: string): Promise<void> {
    await http<unknown>(`/api/projects/${id}`, { method: 'DELETE' });
  }
}
```

- [ ] **Step 3: Run tests** — Expected: PASS (3 tests).

- [ ] **Step 4: Commit**

```bash
git add lib/storage/cloud-project-store.ts lib/storage/cloud-project-store.test.ts
git commit -m "feat: add CloudProjectStore fetch client"
```

---

### Task 11: `R2BlobStore`

**Files:**
- Create: `lib/storage/r2-blob-store.ts`
- Test: `lib/storage/r2-blob-store.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/storage/r2-blob-store.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { R2BlobStore } from './r2-blob-store';

beforeEach(() => vi.restoreAllMocks());

describe('R2BlobStore', () => {
  it('put() requests a presigned URL then PUTs the blob', async () => {
    const f = vi.spyOn(globalThis, 'fetch');
    f.mockResolvedValueOnce(new Response(JSON.stringify({ url: 'https://r2/put', expiresIn: 300 })));
    f.mockResolvedValueOnce(new Response('', { status: 200 }));

    await new R2BlobStore().put('users/u/key', new Blob(['x'], { type: 'image/png' }));
    expect(f.mock.calls[0][0]).toBe('/api/blobs/sign');
    expect(f.mock.calls[1][0]).toBe('https://r2/put');
    expect((f.mock.calls[1][1] as RequestInit).method).toBe('PUT');
  });

  it('get() returns a Blob fetched from the signed URL', async () => {
    const f = vi.spyOn(globalThis, 'fetch');
    f.mockResolvedValueOnce(new Response(JSON.stringify({ url: 'https://r2/get' })));
    f.mockResolvedValueOnce(new Response(new Blob(['hi'], { type: 'image/png' }), { status: 200 }));
    const blob = await new R2BlobStore().get('users/u/key');
    expect(blob).toBeInstanceOf(Blob);
    expect(await blob!.text()).toBe('hi');
  });

  it('get() returns undefined on 404', async () => {
    const f = vi.spyOn(globalThis, 'fetch');
    f.mockResolvedValueOnce(new Response(JSON.stringify({ url: 'https://r2/get' })));
    f.mockResolvedValueOnce(new Response('', { status: 404 }));
    expect(await new R2BlobStore().get('users/u/key')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Write the store**

```ts
// lib/storage/r2-blob-store.ts
import type { BlobStore } from './types';

async function sign(key: string, op: 'put' | 'get', contentType?: string): Promise<string> {
  const res = await fetch('/api/blobs/sign', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ key, op, contentType }),
  });
  if (!res.ok) throw new Error(`SIGN_${res.status}`);
  const { url } = (await res.json()) as { url: string };
  return url;
}

export class R2BlobStore implements BlobStore {
  async put(key: string, blob: Blob): Promise<void> {
    const url = await sign(key, 'put', blob.type || 'application/octet-stream');
    const res = await fetch(url, { method: 'PUT', body: blob, headers: { 'content-type': blob.type || 'application/octet-stream' } });
    if (!res.ok) throw new Error(`PUT_${res.status}`);
  }
  async get(key: string): Promise<Blob | undefined> {
    const url = await sign(key, 'get');
    const res = await fetch(url);
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error(`GET_${res.status}`);
    return await res.blob();
  }
  async remove(key: string): Promise<void> {
    // v1: deletion happens cascadewise on the server (project DELETE removes the row;
    // a separate cleanup job removes orphaned objects). Client remove is a no-op.
    void key;
  }
}
```

- [ ] **Step 3: Run tests** — Expected: PASS (3 tests).

- [ ] **Step 4: Commit**

```bash
git add lib/storage/r2-blob-store.ts lib/storage/r2-blob-store.test.ts
git commit -m "feat: add R2BlobStore using presigned URLs"
```

---

## Phase 5 — Active-stores pointer + SP1 refactor

### Task 12: `active-stores.ts`

**Files:**
- Create: `lib/storage/active-stores.ts`
- Test: `lib/storage/active-stores.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/storage/active-stores.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { getProjectStore, getBlobStore, setActiveAuth } from './active-stores';
import { LocalProjectStore } from './local-project-store';
import { IdbBlobStore } from './idb-blob-store';
import { CloudProjectStore } from './cloud-project-store';
import { R2BlobStore } from './r2-blob-store';

beforeEach(() => setActiveAuth(null));

describe('active stores', () => {
  it('defaults to local + idb when no session', () => {
    expect(getProjectStore()).toBeInstanceOf(LocalProjectStore);
    expect(getBlobStore()).toBeInstanceOf(IdbBlobStore);
  });

  it('switches to cloud + r2 when a session is set', () => {
    setActiveAuth({ userId: 'u1' });
    expect(getProjectStore()).toBeInstanceOf(CloudProjectStore);
    expect(getBlobStore()).toBeInstanceOf(R2BlobStore);
  });

  it('switches back to local when the session is cleared', () => {
    setActiveAuth({ userId: 'u1' });
    setActiveAuth(null);
    expect(getProjectStore()).toBeInstanceOf(LocalProjectStore);
  });
});
```

- [ ] **Step 2: Write the pointer**

```ts
// lib/storage/active-stores.ts
import { LocalProjectStore } from './local-project-store';
import { IdbBlobStore } from './idb-blob-store';
import { CloudProjectStore } from './cloud-project-store';
import { R2BlobStore } from './r2-blob-store';
import type { ProjectStore, BlobStore } from './types';

const localProject: ProjectStore = new LocalProjectStore();
const localBlob: BlobStore = new IdbBlobStore();
const cloudProject: ProjectStore = new CloudProjectStore();
const cloudBlob: BlobStore = new R2BlobStore();

let activeUser: { userId: string } | null = null;

export function setActiveAuth(state: { userId: string } | null): void {
  activeUser = state;
}

export function getProjectStore(): ProjectStore {
  return activeUser ? cloudProject : localProject;
}

export function getBlobStore(): BlobStore {
  return activeUser ? cloudBlob : localBlob;
}

export function getActiveUserId(): string | null {
  return activeUser?.userId ?? null;
}
```

- [ ] **Step 3: Run tests** — Expected: PASS (3 tests).

- [ ] **Step 4: Commit**

```bash
git add lib/storage/active-stores.ts lib/storage/active-stores.test.ts
git commit -m "feat: add active-stores pointer for local/cloud swap"
```

---

### Task 13: Refactor SP1 consumers to accessors

**Files (modify):**
- `components/canvas/use-object-url.ts`
- `lib/upload/load-image.ts`
- `app/projects/page.tsx`
- `app/editor/page.tsx`

All currently `import { projectStore }` or `import { blobStore }` from the SP1 instance modules. Replace each direct usage with the accessor call.

- [ ] **Step 1: Find call sites**

Run: `npx grep -rn "from '@/lib/storage/project-store-instance'" app components lib` and same for `blob-store-instance` to enumerate the exact lines.

- [ ] **Step 2: Modify `components/canvas/use-object-url.ts`** — replace `import { blobStore } from '@/lib/storage/blob-store-instance';` with `import { getBlobStore } from '@/lib/storage/active-stores';` and inside the effect call `getBlobStore().get(blobKey)`.

- [ ] **Step 3: Modify `lib/upload/load-image.ts`** — same pattern: `import { getBlobStore } from '@/lib/storage/active-stores';` and `await getBlobStore().put(ref.blobKey, file);`. The `blobKey` format also changes: when a user is signed in, keys must be prefixed `users/<uid>/`. Update key generation:

```ts
import { getActiveUserId } from '@/lib/storage/active-stores';

// in ingestImageFile:
const userId = getActiveUserId();
const baseKey = `img-${crypto.randomUUID()}`;
const blobKey = userId ? `users/${userId}/${baseKey}` : baseKey;
```

- [ ] **Step 4: Modify `app/projects/page.tsx`** — replace `import { projectStore } from '@/lib/storage/project-store-instance';` with `import { getProjectStore } from '@/lib/storage/active-stores';` and replace every `projectStore.X(...)` with `getProjectStore().X(...)`.

- [ ] **Step 5: Modify `app/editor/page.tsx`** — same.

- [ ] **Step 6: Run tests**

Run: `npm test` — full suite must still pass (all SP1 tests now exercise the accessor with the default-local impl).
Run: `npx tsc --noEmit` — clean.

- [ ] **Step 7: Commit**

```bash
git add components/canvas/use-object-url.ts lib/upload/load-image.ts app/projects/page.tsx app/editor/page.tsx
git commit -m "refactor: route storage access through active-stores accessors"
```

---

## Phase 6 — Auth UX

### Task 14: `SessionProvider` + `AuthSync`

**Files:**
- Create: `components/auth/SessionProvider.tsx`
- Create: `components/auth/AuthSync.tsx`
- Modify: `app/providers.tsx` (wrap with SessionProvider + render AuthSync)
- Test: `components/auth/auth-sync.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/auth/auth-sync.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { AuthSync } from './AuthSync';
import { getProjectStore, setActiveAuth } from '@/lib/storage/active-stores';
import { CloudProjectStore } from '@/lib/storage/cloud-project-store';
import { LocalProjectStore } from '@/lib/storage/local-project-store';

vi.mock('@/lib/auth/client', () => ({
  useSession: vi.fn(),
}));
import { useSession } from '@/lib/auth/client';

beforeEach(() => setActiveAuth(null));

describe('AuthSync', () => {
  it('sets cloud store when a session is present', () => {
    (useSession as any).mockReturnValue({ data: { user: { id: 'u1' } }, isPending: false });
    render(<AuthSync />);
    expect(getProjectStore()).toBeInstanceOf(CloudProjectStore);
  });

  it('reverts to local store when the session is gone', () => {
    (useSession as any).mockReturnValueOnce({ data: { user: { id: 'u1' } }, isPending: false });
    const { rerender } = render(<AuthSync />);
    (useSession as any).mockReturnValueOnce({ data: null, isPending: false });
    rerender(<AuthSync />);
    expect(getProjectStore()).toBeInstanceOf(LocalProjectStore);
  });
});
```

- [ ] **Step 2: Write `SessionProvider`**

Better Auth's React client exposes hooks directly — no provider needed for the session itself. `SessionProvider` is therefore a thin wrapper that exists for future expansion; for v1 it is just a passthrough.

```tsx
// components/auth/SessionProvider.tsx
'use client';
import type { ReactNode } from 'react';
export function SessionProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 3: Write `AuthSync`**

```tsx
// components/auth/AuthSync.tsx
'use client';
import { useEffect } from 'react';
import { useSession } from '@/lib/auth/client';
import { setActiveAuth } from '@/lib/storage/active-stores';

export function AuthSync() {
  const { data } = useSession();
  useEffect(() => {
    setActiveAuth(data?.user ? { userId: data.user.id } : null);
  }, [data?.user?.id]);
  return null;
}
```

- [ ] **Step 4: Modify `app/providers.tsx`** to render `<AuthSync />` inside `<QueryClientProvider>`.

- [ ] **Step 5: Run tests** — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/auth/SessionProvider.tsx components/auth/AuthSync.tsx components/auth/auth-sync.test.tsx app/providers.tsx
git commit -m "feat: add SessionProvider and AuthSync"
```

---

### Task 15: `/login`, `/signup`, `AuthButton`

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/signup/page.tsx`
- Create: `components/auth/AuthButton.tsx`
- Modify: `components/editor/Toolbar.tsx` (render `<AuthButton />`)

Each auth page uses Better Auth client methods `signIn.email`, `signUp.email`, `signIn.social({provider:'google'})`, `signOut`. Render error messages, redirect to `/projects` on success.

- [ ] **Step 1: Write `AuthButton`**

```tsx
// components/auth/AuthButton.tsx
'use client';
import Link from 'next/link';
import { useSession, signOut } from '@/lib/auth/client';

export function AuthButton() {
  const { data, isPending } = useSession();
  if (isPending) return null;
  if (!data?.user) return <Link href="/login">Sign in</Link>;
  return (
    <button type="button" onClick={() => signOut()} aria-label={`Sign out ${data.user.email}`}>
      {data.user.email} · Sign out
    </button>
  );
}
```

- [ ] **Step 2: Write `/login`**

```tsx
// app/(auth)/login/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await signIn.email({ email, password, callbackURL: '/projects' });
    if (res.error) setErr(res.error.message ?? 'Sign in failed');
    else router.push('/projects');
  }

  async function handleGoogle() {
    await signIn.social({ provider: 'google', callbackURL: '/projects' });
  }

  return (
    <main style={{ maxWidth: 360, margin: '64px auto', padding: 24 }}>
      <h1>Sign in</h1>
      <form onSubmit={handleEmail} style={{ display: 'grid', gap: 8 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required />
        <button type="submit">Sign in</button>
      </form>
      <button type="button" onClick={handleGoogle} style={{ marginTop: 8, width: '100%' }}>Continue with Google</button>
      {err && <p style={{ color: '#f87171' }}>{err}</p>}
      <p>No account? <Link href="/signup">Sign up</Link></p>
    </main>
  );
}
```

- [ ] **Step 3: Write `/signup`** — same shape as `/login` but call `signUp.email({email,password,name})` instead. Display "Check your email to verify" on success.

```tsx
// app/(auth)/signup/page.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { signUp, signIn } from '@/lib/auth/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await signUp.email({ email, password, name: email });
    if (res.error) setErr(res.error.message ?? 'Sign up failed');
    else setDone(true);
  }

  if (done) return <main style={{ maxWidth: 360, margin: '64px auto', padding: 24 }}>
    <h1>Check your email</h1>
    <p>We sent a verification link to {email}.</p>
  </main>;

  return (
    <main style={{ maxWidth: 360, margin: '64px auto', padding: 24 }}>
      <h1>Sign up</h1>
      <form onSubmit={handleEmail} style={{ display: 'grid', gap: 8 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required minLength={8} />
        <button type="submit">Create account</button>
      </form>
      <button type="button" onClick={() => signIn.social({ provider: 'google', callbackURL: '/projects' })} style={{ marginTop: 8, width: '100%' }}>Continue with Google</button>
      {err && <p style={{ color: '#f87171' }}>{err}</p>}
      <p>Have an account? <Link href="/login">Sign in</Link></p>
    </main>
  );
}
```

- [ ] **Step 4: Modify `Toolbar`** — render `<AuthButton />` in the right-side button group, after Export.

- [ ] **Step 5: Verify build** — `npx tsc --noEmit`, `npm run build` — both clean.

- [ ] **Step 6: Commit**

```bash
git add app/(auth) components/auth/AuthButton.tsx components/editor/Toolbar.tsx
git commit -m "feat: add login, signup, and toolbar auth button"
```

---

### Task 16: `/auth/verify` and `/auth/reset`

**Files:**
- Create: `app/(auth)/auth/verify/page.tsx`
- Create: `app/(auth)/auth/reset/page.tsx`

Better Auth handles the actual verification + reset endpoints in its catch-all; these pages are the user-facing wrappers that the email links point to.

- [ ] **Step 1: `verify`** — reads `?token=` from the URL, POSTs to Better Auth verify endpoint via the client, shows success or error.

```tsx
// app/(auth)/auth/verify/page.tsx
'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth/client';

function VerifyInner() {
  const token = useSearchParams().get('token') ?? '';
  const [state, setState] = useState<'pending' | 'ok' | 'err'>('pending');
  useEffect(() => {
    if (!token) { setState('err'); return; }
    authClient.verifyEmail({ query: { token } }).then((r) => setState(r.error ? 'err' : 'ok'));
  }, [token]);
  if (state === 'pending') return <p>Verifying…</p>;
  if (state === 'ok') return <p>Email verified. You can now sign in.</p>;
  return <p>Verification failed — the link may have expired.</p>;
}

export default function Page() { return <Suspense><VerifyInner /></Suspense>; }
```

- [ ] **Step 2: `reset`** — two modes: no `?token=` shows the request-reset form (asks for email, calls `forgetPassword`); with token, shows a new-password form (calls `resetPassword`).

```tsx
// app/(auth)/auth/reset/page.tsx
'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth/client';

function ResetInner() {
  const token = useSearchParams().get('token') ?? '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  if (token) {
    return (
      <form onSubmit={async (e) => {
        e.preventDefault();
        const r = await authClient.resetPassword({ token, newPassword: password });
        setMsg(r.error ? r.error.message ?? 'Reset failed' : 'Password updated. Sign in.');
      }} style={{ display: 'grid', gap: 8, maxWidth: 360, margin: '64px auto' }}>
        <h1>Set new password</h1>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        <button type="submit">Update password</button>
        {msg && <p>{msg}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      await authClient.forgetPassword({ email, redirectTo: '/auth/reset' });
      setMsg('If that email is registered, a reset link is on the way.');
    }} style={{ display: 'grid', gap: 8, maxWidth: 360, margin: '64px auto' }}>
      <h1>Reset password</h1>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <button type="submit">Send reset link</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}

export default function Page() { return <Suspense><ResetInner /></Suspense>; }
```

- [ ] **Step 3: Verify build** — clean.

- [ ] **Step 4: Commit**

```bash
git add app/(auth)/auth
git commit -m "feat: add email verification and password reset pages"
```

---

## Phase 7 — Migration

### Task 17: `MigrationRunner`

**Files:**
- Create: `lib/migration/run-migration.ts`
- Create: `components/migration/MigrationRunner.tsx`
- Modify: `app/projects/page.tsx` (mount the runner)
- Test: `lib/migration/run-migration.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/migration/run-migration.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runMigration, MIGRATED_FLAG } from './run-migration';
import { LocalProjectStore } from '@/lib/storage/local-project-store';
import { IdbBlobStore } from '@/lib/storage/idb-blob-store';
import { createBlankDoc } from '@/lib/document/factory';

beforeEach(() => localStorage.clear());

function mockFetchSequence(...responses: Response[]) {
  let i = 0;
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => responses[i++]);
}

describe('runMigration', () => {
  it('uploads each local project to the cloud and sets the migrated flag', async () => {
    const local = new LocalProjectStore();
    const blob = new IdbBlobStore();
    const doc = createBlankDoc();
    const id = await local.create('P', doc);

    // No image attached for this MVP test; full path covered by E2E.
    // sequence: POST /api/projects -> {id}
    mockFetchSequence(
      new Response(JSON.stringify({ id: 'cloud-1' })),
    );

    const result = await runMigration({ local, blob, userId: 'u1' });
    expect(result.migrated).toBe(1);
    expect(localStorage.getItem(MIGRATED_FLAG)).toBe('1');
    expect((await local.list()).find((p) => p.id === id)).toBeUndefined();
  });

  it('is a no-op when the flag is already set', async () => {
    localStorage.setItem(MIGRATED_FLAG, '1');
    const result = await runMigration({
      local: new LocalProjectStore(), blob: new IdbBlobStore(), userId: 'u1',
    });
    expect(result.migrated).toBe(0);
  });
});
```

- [ ] **Step 2: Write the runner**

```ts
// lib/migration/run-migration.ts
import type { ProjectStore, BlobStore } from '@/lib/storage/types';

export const MIGRATED_FLAG = 'screenstyler:migrated';

type Args = { local: ProjectStore; blob: BlobStore; userId: string };
type Result = { migrated: number; failed: number };

async function uploadImage(blob: BlobStore, baseKey: string, userId: string): Promise<string | null> {
  const data = await blob.get(baseKey);
  if (!data) return null;
  const newKey = `users/${userId}/${baseKey}`;
  // Use the cloud BlobStore (the active impl is already cloud because the user is signed in).
  // For migration we go through the active accessor:
  const { getBlobStore } = await import('@/lib/storage/active-stores');
  await getBlobStore().put(newKey, data);
  return newKey;
}

export async function runMigration({ local, blob, userId }: Args): Promise<Result> {
  if (localStorage.getItem(MIGRATED_FLAG)) return { migrated: 0, failed: 0 };

  const metas = await local.list();
  let migrated = 0;
  let failed = 0;

  for (const meta of metas) {
    try {
      const doc = await local.load(meta.id);
      const sourceKey = (doc as { content?: { image?: { blobKey?: string } | null } }).content?.image?.blobKey ?? null;
      const newKey = sourceKey ? await uploadImage(blob, sourceKey, userId) : null;

      const res = await fetch('/api/projects', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: meta.name, doc, sourceImageKey: newKey }),
      });
      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      await local.remove(meta.id);
      migrated++;
    } catch {
      failed++;
    }
  }

  if (failed === 0) localStorage.setItem(MIGRATED_FLAG, '1');
  return { migrated, failed };
}
```

- [ ] **Step 3: Write the component**

```tsx
// components/migration/MigrationRunner.tsx
'use client';
import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth/client';
import { useQueryClient } from '@tanstack/react-query';
import { runMigration, MIGRATED_FLAG } from '@/lib/migration/run-migration';
import { LocalProjectStore } from '@/lib/storage/local-project-store';
import { IdbBlobStore } from '@/lib/storage/idb-blob-store';

export function MigrationRunner() {
  const { data } = useSession();
  const userId = data?.user?.id;
  const queryClient = useQueryClient();
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'err'>('idle');
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!userId) return;
    if (localStorage.getItem(MIGRATED_FLAG)) return;
    setState('running');
    runMigration({ local: new LocalProjectStore(), blob: new IdbBlobStore(), userId })
      .then((r) => {
        setN(r.migrated);
        setState(r.failed ? 'err' : 'done');
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      })
      .catch(() => setState('err'));
  }, [userId, queryClient]);

  if (state === 'idle' || state === 'done') return null;
  if (state === 'running') return <div style={banner}>Migrating local projects…</div>;
  return <div style={{ ...banner, background: '#7f1d1d' }}>Some projects failed to migrate. They remain in this browser.</div>;
}

const banner: React.CSSProperties = {
  position: 'fixed', bottom: 16, right: 16, padding: '8px 12px',
  background: '#1e293b', color: '#e5e7eb', borderRadius: 8,
};
```

- [ ] **Step 4: Modify `app/projects/page.tsx`** — render `<MigrationRunner />` inside the main element.

- [ ] **Step 5: Run tests** — `npm test` (full suite green) — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/migration components/migration app/projects/page.tsx
git commit -m "feat: auto-migrate localStorage projects to cloud on first sign-in"
```

---

## Phase 8 — End-to-end

### Task 18: Playwright cloud happy path

**Files:**
- Create: `e2e/cloud.spec.ts`
- Modify: `playwright.config.ts` (set test env vars so the server runs with pglite + a fixed `BETTER_AUTH_SECRET`)
- Modify: `app/editor/page.tsx` (no behavior change, ensure compatibility)

- [ ] **Step 1: Configure Playwright env**

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      NEON_DATABASE_URL: '',                       // pglite path
      BETTER_AUTH_URL: 'http://localhost:3000',
      BETTER_AUTH_SECRET: 'e2e-secret-32chars-______________',
      GOOGLE_CLIENT_ID: 'dev',
      GOOGLE_CLIENT_SECRET: 'dev',
      NODE_ENV: 'test',                            // forces pglite branch in client.ts
    },
  },
});
```

(SP1's E2E `e2e/editor.spec.ts` continues to work since it does not exercise auth.)

- [ ] **Step 2: Write the cloud spec**

```ts
// e2e/cloud.spec.ts
import { test, expect } from '@playwright/test';

test('sign up, create a project, reload, project persists', async ({ page }) => {
  // Sign up
  await page.goto('/signup');
  const email = `e2e-${Date.now()}@test.local`;
  await page.fill('input[type=email]', email);
  await page.fill('input[type=password]', 'password1234');
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page.getByText(/check your email/i)).toBeVisible();

  // Skip verification gate in tests: hit the dev verify endpoint directly.
  // (Better Auth's test mode exposes a server-side helper; alternatively,
  //  the auth/server.ts can be configured with `requireEmailVerification: false`
  //  when NODE_ENV === 'test'. The implementer chooses the simpler path.)

  await page.goto('/login');
  await page.fill('input[type=email]', email);
  await page.fill('input[type=password]', 'password1234');
  await page.getByRole('button', { name: /^sign in$/i }).click();

  await expect(page).toHaveURL(/\/projects/);
  await page.getByRole('button', { name: 'New project' }).click();
  await expect(page).toHaveURL(/\/editor\?id=/);

  // Reload — project must persist.
  await page.reload();
  await expect(page.getByText(/screenstyler/i).first()).toBeVisible();
});
```

(Note: email verification — the simplest test mode is to set `requireEmailVerification: false` when `NODE_ENV === 'test'` in `lib/auth/server.ts`. Make that change here. Production keeps verification on.)

- [ ] **Step 3: Make the verification toggle**

In `lib/auth/server.ts`, change `requireEmailVerification: true` to `requireEmailVerification: process.env.NODE_ENV !== 'test'`.

- [ ] **Step 4: Run all gates**

Run: `npm run test` — Expected: all suites green.
Run: `npx tsc --noEmit` — clean.
Run: `npm run lint` — clean.
Run: `npm run build` — succeeds.
Run: `npm run test:e2e` — both E2E specs pass (editor SP1 + cloud SP2).

- [ ] **Step 5: Commit**

```bash
git add app/editor/page.tsx playwright.config.ts e2e/cloud.spec.ts lib/auth/server.ts
git commit -m "feat: end-to-end cloud sign-up and project persistence test"
```

---

## Definition of Done

- All unit and component suites pass (`npm run test`).
- Both Playwright specs pass (`npm run test:e2e`).
- `tsc --noEmit`, `npm run lint`, `npm run build` all clean.
- Manual smoke: anonymous editor still works; sign-up + sign-in works; signing in migrates any local projects; signed-in projects persist across reload; sign-out reverts to local-only behaviour.

## Out of scope (after SP2)

Real-time collaboration, shared/public projects, billing, server-side "pro export", and the SP1-deferred features (3D tilt, frame mockups, annotations, style presets, save-time thumbnails, IndexedDB private-mode fallback, corrupt-doc recovery screen).
