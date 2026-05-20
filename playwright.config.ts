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
      NEON_DATABASE_URL: '',
      BETTER_AUTH_URL: 'http://localhost:3000',
      BETTER_AUTH_SECRET: 'e2e-secret-32-chars-________________',
      GOOGLE_CLIENT_ID: 'dev',
      GOOGLE_CLIENT_SECRET: 'dev',
      E2E_SKIP_EMAIL_VERIFICATION: '1',
    },
  },
});
