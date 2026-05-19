# Screenstyler — Accounts + Cloud (Sub-project 2) — Design

**Date:** 2026-05-19
**Status:** Approved (user delegated remaining decisions; ask only on critical points)
**Builds on:** Sub-project 1 — Editor Core MVP (already on `master`).
**Companion spec:** `2026-05-19-editor-core-design.md`.

## Overview

Add accounts and cloud storage to Screenstyler. Anonymous users keep using the
local-only editor exactly as today. Signed-in users get their projects in a Neon
Postgres database and their image blobs in Cloudflare R2. The seam introduced in
Sub-project 1 (`ProjectStore` / `BlobStore` interfaces) is the only thing the editor
sees, so adding cloud is a swap of the active implementation, not a rewrite.

## Goals

- Email/password and Google OAuth via Better Auth.
- Per-user project storage in Neon (Postgres + Drizzle ORM).
- Per-user image blob storage in Cloudflare R2 via presigned URLs.
- Anonymous editing keeps working unchanged.
- On the first sign-in, the user's existing local projects are migrated to the cloud
  automatically.
- The editor itself is not changed. It continues to talk to `ProjectStore` /
  `BlobStore` accessors; the accessor returns the cloud implementation when a session
  is active.

## Non-Goals (out of scope for SP2)

- Teams, shared projects, multi-user collaboration.
- Real-time collaboration (CRDTs, presence).
- Project versioning beyond the editor's undo/redo.
- Public sharing links.
- Billing or subscription gating.
- Avatar uploads.
- A mobile-friendly auth UX (desktop-first, like the editor).

## Tech Stack (additions on top of SP1)

| Layer | Choice | Rationale |
|---|---|---|
| Database | Neon Postgres + Drizzle ORM | User-chosen; typed schema + migrations |
| Auth | Better Auth (latest) | Own tables in Neon; no third-party auth service |
| Email | Resend | Modern API, generous free tier, simple |
| Blob | Cloudflare R2 via `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` | S3-compatible, no egress fees |
| API | Next.js 16 Route Handlers | Stay in one deploy; REST-ish |
| Validation | `zod` (already installed) | Reuse `screenstylerDocSchema` for save endpoints |
| Test DB | `@electric-sql/pglite` | Real Postgres in-process; no Docker, no Neon for tests |

## Architecture

### Module additions

```
app/api/
  auth/[...all]/route.ts          Better Auth catch-all (signup/signin/oauth/verify/reset)
  projects/route.ts                GET list, POST create
  projects/[id]/route.ts           GET load, PATCH save, DELETE remove
  blobs/sign/route.ts              POST {key, op, contentType?} -> presigned URL

app/(auth)/
  login/page.tsx
  signup/page.tsx
  auth/verify/page.tsx
  auth/reset/page.tsx

components/auth/
  AuthButton.tsx                   toolbar avatar + sign-in/sign-out
  AuthSync.tsx                     keeps the active-store pointer in sync with the session
  SessionProvider.tsx              wraps the app, exposes Better Auth client session

components/migration/
  MigrationRunner.tsx              one-shot post-sign-in migrator with progress

lib/db/
  client.ts                        Neon serverless driver (or pglite in test mode)
  schema.ts                        Drizzle schema (auth tables + projects)
  migrations/                      drizzle-kit output

lib/auth/
  server.ts                        Better Auth server config (db adapter, providers, email)
  client.ts                        Better Auth client (useSession, signIn, signOut)
  session.ts                       requireSession helper for route handlers

lib/blob/
  r2-server.ts                     server-side S3 client + presign helpers
  signed-url-client.ts             client helper to fetch a presigned URL

lib/storage/
  cloud-project-store.ts           CloudProjectStore implements ProjectStore (fetch-based)
  r2-blob-store.ts                 R2BlobStore implements BlobStore (signed-URL based)
  active-stores.ts                 module-level pointers + getProjectStore() / getBlobStore() / setActiveAuth()
```

The SP1 files `lib/storage/project-store-instance.ts` and
`lib/storage/blob-store-instance.ts` become thin re-exports of the local impls;
consumers move from `import { projectStore }` to `import { getProjectStore }`.

### The store-pointer pattern

`lib/storage/active-stores.ts` holds two module-level mutable variables: the current
`ProjectStore` and `BlobStore`. It exports `getProjectStore()` / `getBlobStore()`
(accessor functions) and `setActiveAuth(session)` (mutator). The default values are
the local implementations. `AuthSync` mounted at the app root subscribes to Better
Auth's `useSession()` and calls `setActiveAuth(session)` on changes; that swaps the
pointers to `CloudProjectStore` / `R2BlobStore` when a session exists and back to
the local stores when it does not.

Consumers that currently import `projectStore` / `blobStore` directly are migrated
to the accessor calls. There are ~5 such call sites (`useObjectUrl`,
`ingestImageFile`, `app/projects/page.tsx`, `app/editor/page.tsx`). Small refactor.

### Data flow

- **Sign-in:** Better Auth client `signIn.email` or `signIn.social({provider:'google'})`
  → cookie session → `useSession()` updates → `AuthSync` swaps stores → TanStack
  Query invalidates `['projects']`.
- **List / load / save / delete project:** TanStack Query and mutations call
  `getProjectStore()` (no change at call sites). Under the hood the cloud impl
  `fetch`es `/api/projects[...]`.
- **Upload image (signed-in):** `ingestImageFile` calls `getBlobStore().put(key, blob)`
  which: requests a presigned PUT URL from `/api/blobs/sign`, then PUTs the blob to
  R2 directly. `get(key)` requests a presigned GET URL.
- **Migration:** on the first post-sign-in mount, `MigrationRunner` reads
  `LocalProjectStore.list()`; for each, loads the doc + the source blob from
  `IdbBlobStore`, PUTs the blob via R2, then `POST /api/projects` with
  `{name, doc, source_image_key}`. After all succeed, sets a `screenstyler:migrated`
  flag and removes local docs. Failures are surfaced and left in localStorage for
  retry.

## Data Model (Neon)

Drizzle schema in `lib/db/schema.ts`. Better Auth's standard adapter tables plus one
domain table:

- `users` — id (uuid pk), email (unique), email_verified (boolean), name?, image?, created_at, updated_at.
- `sessions` — id, user_id, token, expires_at, ip?, user_agent?.
- `accounts` — id, user_id, provider_id, account_id, access_token?, refresh_token?, password? (hashed for email/password).
- `verifications` — id, identifier, value, expires_at — email verification + password reset tokens.
- **`projects`** — id (uuid pk, default `gen_random_uuid()`), user_id (uuid → users, cascade delete), name (text), doc (jsonb), source_image_key (text, nullable), thumbnail_key (text, nullable), created_at, updated_at. Index on `(user_id, updated_at desc)` for list order.

R2 object keys follow `users/<user_id>/<key>` so signing logic can validate the
prefix matches the session's user id.

## API Surface

All routes under `/api`, JSON in/out, return 401 if no session (except `/api/auth/*`).
Request bodies validated with zod.

| Route | Methods | Body | Returns |
|---|---|---|---|
| `/api/auth/[...all]` | Better Auth | n/a | n/a |
| `/api/projects` | GET | — | `ProjectMeta[]` (for the session user) |
| `/api/projects` | POST | `{name, doc, source_image_key?}` | `{id}` |
| `/api/projects/[id]` | GET | — | `ScreenstylerDoc` |
| `/api/projects/[id]` | PATCH | `{doc, meta?:{name?}}` | `{}` |
| `/api/projects/[id]` | DELETE | — | `{}` |
| `/api/blobs/sign` | POST | `{key, op:'put'|'get', contentType?}` | `{url, expiresIn}` |

Ownership: every project query is scoped to `user_id = session.user.id`. Every blob
sign request validates `key` starts with `users/<session.user.id>/`.

## Auth UX

- **`/login`** — email + password fields, "Continue with Google" button, link to
  `/signup`.
- **`/signup`** — email + password + confirm password, "Continue with Google".
- **`/auth/verify`** — handles `?token=` from verification email; shows success or error.
- **`/auth/reset`** — request-reset form + reset-with-token form; uses Resend.
- **Toolbar AuthButton** — when anonymous shows "Sign in" link; when signed-in shows
  avatar + dropdown with email + Sign out.
- **Sign-in redirect** — after sign-in route back to the original page if available,
  else `/projects`. First-time sign-in triggers `MigrationRunner` on the next page
  mount (it self-gates on the `screenstyler:migrated` flag).
- The editor remains usable without sign-in. The Cloud Save state is implicit in
  whether `getProjectStore()` returns the local or cloud impl.

## Error Handling

| Case | Behavior |
|---|---|
| 401 from a project API call | Sign out client side; AuthSync swaps back to local; show "Session expired, sign in to save" banner; preserve unsaved edits in the editor store |
| Network error on save | TanStack Query retry (already configured `retry: 1`); banner if persistent |
| R2 upload failure | Toast + retry button; project save aborts cleanly |
| Migration: one project fails | Keep that project in localStorage; log and surface; flag stays unset so a retry runs next mount |
| `MigrationRunner` interrupted (tab closed) | Migration is idempotent — projects already pushed get skipped (server returns conflict on duplicate `source_image_key` write — actually the simpler approach is: migration creates a fresh cloud project each run; localStorage entries are only deleted after the cloud create succeeds, so re-running picks up the remaining unmigrated ones) |
| OAuth callback failure | `/auth/error` page with message |

## Testing

- **DB:** `@electric-sql/pglite` for unit tests. A small fixture spins up an
  in-process Postgres, applies Drizzle migrations, and provides a `db` handle per
  test.
- **Route handlers:** unit tests with a mocked Better Auth session and a fresh
  pglite DB per test file.
- **Cloud stores:** `CloudProjectStore` / `R2BlobStore` tested against a mocked
  `fetch` (msw or hand-rolled).
- **Active-stores pointer:** unit-tested that `setActiveAuth(null)` and
  `setActiveAuth(session)` flip the accessors.
- **Migration:** unit test with seeded local stores + mocked cloud API; assert the
  cloud receives N projects, the local entries are removed, the flag is set.
- **E2E (Playwright):** extend the existing happy path with a sign-up flow ending
  in a cloud-persisted project (uses pglite via the test server's `webServer`
  config, so no external Neon required).

## Module Boundaries (key seams)

- `lib/db/schema.ts` — the only place that knows table shapes. Migrations are
  generated from here.
- `lib/auth/server.ts` — the only place that wires Better Auth + providers + email.
  `lib/auth/client.ts` is the only client-side auth surface.
- `lib/blob/r2-server.ts` — the only place that constructs the S3 client and signs
  URLs. Route handler is a thin wrapper.
- `lib/storage/active-stores.ts` — the only mutable global state outside the editor
  Zustand stores. Tightly scoped, tested.
- `lib/storage/cloud-project-store.ts` / `r2-blob-store.ts` — implement the existing
  interfaces; no editor changes required.

## Environment Variables

Documented in `.env.example`. Required at runtime:

```
NEON_DATABASE_URL=postgres://...
BETTER_AUTH_URL=http://localhost:3000          # full URL of the app
BETTER_AUTH_SECRET=...                          # 32-byte random
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
RESEND_API_KEY=...
RESEND_FROM=noreply@example.com
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=screenstyler
R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
```

For local development without these set, the editor falls back to the SP1
local-only behavior (the cloud features simply do not appear active).

## Risks

- **Auto-migration of large blobs** on slow connections — `MigrationRunner` shows
  a progress UI and tolerates per-project failure.
- **Neon cold start** on the first request after idle (200–500ms). Acceptable for
  v1; can be smoothed later with a keep-alive ping.
- **R2 access control** — keys are server-validated to live under
  `users/<session.user.id>/`. No path traversal because keys are opaque strings
  validated server-side; the bucket is private and only reachable via signed URLs.
- **Race between autosave and session expiry** — the editor catches 401 from save,
  reverts the active store, and shows a sign-in banner; the in-memory document is
  preserved (autosave still snapshots to localStorage as a safety net — added in SP2).

## Future Work (after SP2)

Real-time collaboration, shared projects, public links, billing, server-side
"pro export" via headless Chromium, and the SP1 deferrals
(3D tilt, frame mockups, annotations, style presets, save-time thumbnails,
IndexedDB private-mode fallback, corrupt-doc recovery screen).
