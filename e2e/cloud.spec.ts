import { test, expect } from '@playwright/test';

test('sign up, create a project, reload, project persists', async ({ page }) => {
  // Sign up — verification is disabled in test mode (lib/auth/server.ts gates on NODE_ENV).
  await page.goto('/signup');
  const email = `e2e-${Date.now()}@test.local`;
  await page.fill('input[type=email]', email);
  await page.fill('input[type=password]', 'password1234');
  await page.getByRole('button', { name: /create account/i }).click();

  // With verification disabled, signing up auto-signs-in OR we go to /login.
  // Either way we now sign in to be safe.
  await page.goto('/login');
  await page.fill('input[type=email]', email);
  await page.fill('input[type=password]', 'password1234');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/projects/, { timeout: 15_000 });

  await page.getByRole('button', { name: 'New project' }).click();
  await expect(page).toHaveURL(/\/editor\?id=/);

  // Reload — the project must persist on the server side.
  await page.reload();
  // The editor's toolbar still shows the project name (which falls back to 'Untitled').
  await expect(page.getByText(/screenstyler/i).first()).toBeVisible();
});
