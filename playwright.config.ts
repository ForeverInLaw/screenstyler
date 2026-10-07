import { defineConfig } from '@playwright/test';

const port = Number(process.env.E2E_PORT ?? 3101);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  use: { baseURL },
  webServer: {
    command: `npm run build && npm run start -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      NEON_DATABASE_URL: '',
      DATABASE_URL: 'sqlite:./.next/e2e.db',
      LOCAL_BLOB_DIR: './.next/e2e-blobs',
      NEXT_PUBLIC_LOCAL_ONLY: '',
      BETTER_AUTH_URL: baseURL,
      BETTER_AUTH_SECRET: 'e2e-secret-32-chars-________________',
      GOOGLE_CLIENT_ID: 'dev',
      GOOGLE_CLIENT_SECRET: 'dev',
      E2E_SKIP_EMAIL_VERIFICATION: '1',
      RESEND_API_KEY: '',
      RESEND_FROM: '',
      R2_ENDPOINT: '',
      R2_ACCESS_KEY_ID: '',
      R2_SECRET_ACCESS_KEY: '',
    },
  },
});
