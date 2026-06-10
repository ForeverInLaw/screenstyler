# ScreenStyler

A modern, high-fidelity browser screenshot decorator, visual editor, and device mockup tool. Built with Next.js, React 19, Zustand, Better Auth, and Drizzle.

## Setup steps

Follow these steps to set up and run ScreenStyler locally:

### 1. Install dependencies

Use Node.js 20.12 or newer, then install packages:

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to create `.env` (or `.env.local`):

```bash
cp .env.example .env
```

Open `.env` and configure the values you need:

- `NEON_DATABASE_URL`: PostgreSQL connection string for Neon-backed auth and cloud projects. If left empty, local API routes fall back to PGlite for tests and lightweight local development.
- `BETTER_AUTH_SECRET`: Secret key for session hashing. Generate one with:

  ```bash
  npx @better-auth/cli secret
  ```

- `BETTER_AUTH_URL`: The URL you open in the browser. If you run `npm run dev -- -p 8080`, set this to `http://localhost:8080`.
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Optional Google OAuth configuration for cloud login.
- `RESEND_API_KEY` & `RESEND_FROM`: Email provider settings for passwordless login and verification.
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`: Cloudflare R2 storage credentials for cloud screenshots and thumbnails.
  Use the S3 API endpoint origin shown in the bucket settings, without the bucket path. For example, if Cloudflare shows `https://<account-id>.r2.cloudflarestorage.com/screenstyler-dev`, set `R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com` and `R2_BUCKET=screenstyler-dev`.

### 3. Apply the database schema

If `NEON_DATABASE_URL` points at a real database, apply the Drizzle schema before signing up or using cloud projects:

```bash
npm run db:push
```

This creates the Better Auth tables (`users`, `sessions`, `accounts`, `verifications`) and the `projects` table. Without this step, sign up can fail with `relation "users" does not exist`.

For migration-file based deploys, use:

```bash
npm run db:migrate
```

When you edit `lib/db/schema.ts`, generate a migration with:

```bash
npx drizzle-kit generate
```

### 4. Run the dev server

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

To use another port:

```bash
npm run dev -- -p 8080
```

Set `BETTER_AUTH_URL` to the same origin when changing ports.

---

## Docker

The app ships as a multi-stage Docker image built on Next.js `output: "standalone"`.
Postgres (Neon) and object storage (R2) are external managed services, so the
image runs only the Next.js server — there is no bundled database container.

### Build and run

```bash
docker compose up --build -d
```

This builds `screenstyler:latest`, injects credentials from `.env` at runtime
(`.env` is never copied into the image), and serves on
[http://localhost:3000](http://localhost:3000). A `/api/health` endpoint backs
the container healthcheck.

For production set `NEON_DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
(your public origin), and the `R2_*` values in `.env`.

### Database migrations

`drizzle-kit` is a dev dependency and is **not** present in the runtime image.
Apply the schema to your Neon database from a full install before first deploy:

```bash
npm run db:migrate
```

---

## Testing

ScreenStyler features a comprehensive test suite covering database queries, local fallback stores, store undo/redo functionality, and UI components.

### Run Unit/Integration Tests
Runs the Vitest test runner:
```bash
npm run test
```

To run in watch mode:
```bash
npm run test:watch
```

### Run End-to-End Tests
Runs Playwright browser tests:
```bash
npm run test:e2e
```
