import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('create a project, upload an image, and export a PNG', async ({ page }) => {
  await page.goto('/projects');
  await page.getByRole('button', { name: 'New project' }).click();
  await expect(page).toHaveURL(/\/editor\?id=/);

  // 1x1 white PNG fixture (valid PNG – IHDR + IDAT + IEND)
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC',
    'base64',
  );
  await page.setInputFiles('input[type=file]', {
    name: 'shot.png', mimeType: 'image/png', buffer: png,
  });

  await expect(page.getByTestId('document-frame')).toBeVisible({ timeout: 15_000 });

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/\.png$/);
  expect(readFileSync(await file.path()).length).toBeGreaterThan(0);
});
