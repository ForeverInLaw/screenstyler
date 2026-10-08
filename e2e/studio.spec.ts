import { test, expect } from '@playwright/test';
import { solidImageFixtures } from './canvas-fixtures';

async function createProject(page: import('@playwright/test').Page, name: string) {
  await page.goto('/projects');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Project name').fill(name);
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page).toHaveURL(/\/editor\?id=/);
}

const screenshot = {
  name: 'shot.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC',
    'base64',
  ),
};

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
  await page.getByRole('combobox', { name: 'Sort projects' }).click();
  await page.getByRole('option', { name: 'Name A–Z', exact: true }).click();
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
  await page.locator('input[type=file]').first().setInputFiles(screenshot);
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

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test(`studio controls support keyboard editing and Undo at width ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await createProject(page, 'Control interaction');
    const [shot] = await solidImageFixtures(page, ['#e8b66b']);
    await page.locator('input[type=file]').first().setInputFiles(shot);
    const image = page.getByTestId('screenshot-item');
    await expect(image).toHaveCount(1);
    await image.click();

    const frame = page.getByRole('combobox', { name: 'Type:', exact: true });
    await frame.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(frame).toContainText('Window Frame');
    await expect(frame).toBeFocused();
    await expect(page.getByRole('combobox', { name: 'Style:', exact: true })).toContainText('macOS Light');
    await page.keyboard.press('Control+z');
    await expect(frame).toContainText('Window Frame');
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(frame).toContainText('None (Standard)');

    await frame.click();
    await page.keyboard.press('Delete');
    await expect(image).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(frame).toBeFocused();

    const grid = page.getByRole('checkbox', { name: 'Show Grid lines', exact: true });
    await grid.focus();
    await page.keyboard.press('Space');
    await expect(grid).toBeChecked();
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(grid).not.toBeChecked();
    await page.getByText('Snap elements to Grid', { exact: true }).click();
    await expect(page.getByRole('checkbox', { name: 'Snap elements to Grid', exact: true })).toBeChecked();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  });
}
