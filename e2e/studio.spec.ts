import { test, expect } from '@playwright/test';

async function createProject(page: import('@playwright/test').Page, name: string) {
  await page.goto('/projects');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Project name').fill(name);
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page).toHaveURL(/\/editor\?id=/);
}

test('project dialogs contain keyboard focus and restore it on dismissal', async ({ page }) => {
  await page.goto('/projects');
  const trigger = page.getByRole('button', { name: 'New project', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'New project', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Project name')).toBeFocused();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    // Native dialogs allow Tab into browser chrome, while the page stays inert.
    expect(
      await dialog.evaluate((node) => !document.hasFocus() || node.contains(document.activeElement)),
    ).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('projects can be filtered, sorted, and renamed from the gallery', async ({ page }) => {
  await createProject(page, 'Zebra shot');
  await createProject(page, 'Alpha shot');
  await page.goto('/projects');
  await page.getByLabel('Sort projects').selectOption('name');
  await expect(page.getByRole('link', { name: /^Open .* shot$/ }).first()).toHaveAttribute(
    'aria-label',
    'Open Alpha shot',
  );
  await page.getByLabel('Search projects').fill('zebra');
  await expect(page.getByRole('link', { name: 'Open Zebra shot' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Alpha shot' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Rename Zebra shot', exact: true }).click();
  await page.getByLabel('Project name').fill('Zebra release');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Open Zebra release' })).toBeVisible();
  await page.getByLabel('Search projects').fill('not-present');
  await expect(page.getByText('No matching projects.')).toBeVisible();
  await page.getByRole('button', { name: 'clear your search', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open Alpha shot' })).toBeVisible();
});

test('the mobile editor can collapse its inspector and control viewport zoom', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await createProject(page, 'Mobile composition');
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC',
    'base64',
  );
  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles({ name: 'shot.png', mimeType: 'image/png', buffer: png });
  const canvas = page.getByTestId('canvas-stage');
  await expect(canvas).toBeVisible();
  const initialHeight = (await canvas.boundingBox())!.height;
  await page.getByRole('button', { name: 'Toggle inspector', exact: true }).click();
  await expect(page.getByRole('complementary', { name: 'Design inspector' })).toHaveCount(0);
  expect((await canvas.boundingBox())!.height).toBeGreaterThan(initialHeight);
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(page.getByText('110%', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Fit canvas', exact: true }).click();
  await expect(page.getByText('100%', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
