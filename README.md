# ScreenStyler

A modern, high-fidelity browser screenshot decorator, visual editor, and device mockup tool. Built with Next.js, React 19, Zustand, Better Auth, and Drizzle.

## Setup Steps

Follow these steps to set up and run ScreenStyler locally:

### 1. Clone & Install Dependencies
Ensure you have Node.js installed, then install the package dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to create `.env` (or `.env.local`):
```bash
cp .env.example .env
```

Open `.env` and configure the following parameters:
- `NEON_DATABASE_URL`: Your PostgreSQL connection string. 
  *(Note: If left empty/undefined, the app automatically falls back to an in-memory/disk **PGlite** instance, which is excellent for local dev and testing without Neon).*
- `BETTER_AUTH_SECRET`: Secret key for session hashing. Generate one with:
  ```bash
  npx @better-auth/cli secret
  ```
- `BETTER_AUTH_URL`: The local URL of your app (defaults to `http://localhost:3000`).
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Optional Google OAuth configuration for cloud login.
- `RESEND_API_KEY` & `RESEND_FROM`: Email provider settings for passwordless login and verification.
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`: Cloudflare R2 storage credentials for cloud screenshots and thumbnails.
  *(Note: Locally, images fall back to browser **IndexedDB** blob storage when not authenticated).*

### 3. Database Schema Setup
Database migrations are applied automatically during app startup (dev server or API invocations) through self-healing migration clients.
To generate a new migration after editing `lib/db/schema.ts`:
```bash
npx drizzle-kit generate
```

### 4. Running the Dev Server
Start the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

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
