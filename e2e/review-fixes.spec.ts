import { test, expect, type Page } from '@playwright/test';
import { bounds, drag, newCanvas, pointOn, solidImageFixtures } from './canvas-fixtures';

test.use({ viewport: { width: 1440, height: 1000 } });

async function scene(page: Page, grouped = false) {
  await newCanvas(page);
  await page.setInputFiles('input[type=file]', await solidImageFixtures(page,
    grouped ? ['#dc2626', '#2563eb'] : ['#2563eb']));
  const images = page.getByTestId('screenshot-item');
  await expect(images).toHaveCount(grouped ? 2 : 1);
  await page.getByRole('button', { name: 'Select', exact: true }).click();
  await page.keyboard.press('Control+a');
  return images;
}

function expectPoint(actual: { x: number; y: number }, expected: { x: number; y: number }) {
  expect(Math.hypot(actual.x - expected.x, actual.y - expected.y)).toBeLessThan(1.5);
}

const corners = [
  { name: 'top left', x: 0, y: 0 },
  { name: 'top right', x: 1, y: 0 },
  { name: 'bottom left', x: 0, y: 1 },
  { name: 'bottom right', x: 1, y: 1 },
] as const;

for (const mode of ['single', 'group', 'framed group'] as const) {
  for (const corner of mode === 'framed group' ? corners.slice(0, 1) : corners) {
    test(`vertical-only resize changes a ${mode} from its ${corner.name} corner`, async ({ page }) => {
      const grouped = mode !== 'single';
      const images = await scene(page, grouped);
      if (mode === 'framed group') await page.getByRole('combobox', { name: 'Type:', exact: true }).selectOption('window');
      const selection = grouped ? page.getByTestId('screenshot-group-selection') : images.first();
      const original = await bounds(selection);
      const originals = await Promise.all([0, ...(grouped ? [1] : [])].map((index) => bounds(images.nth(index))));
      const grip = await pointOn(selection, corner);
      const opposite = { x: 1 - corner.x, y: 1 - corner.y };
      const anchor = await pointOn(selection, opposite);
      const dy = corner.y === 0 ? -32 : 32;
      await drag(page, grip, { x: 0, y: dy });

      const resized = await bounds(selection);
      expect(resized.width).toBeGreaterThan(original.width + 15);
      expect(resized.height).toBeGreaterThan(original.height + 15);
      expect(Math.abs((await pointOn(selection, corner)).y - grip.y - dy)).toBeLessThan(1.5);
      expectPoint(await pointOn(selection, opposite), anchor);
      if (mode !== 'framed group') {
        for (const [index, before] of originals.entries()) {
          const after = await bounds(images.nth(index));
          expect(Math.abs(after.width / after.height - before.width / before.height)).toBeLessThan(0.01);
        }
      }
      await page.getByRole('button', { name: 'Undo', exact: true }).click();
      for (const [index, before] of originals.entries()) {
        const after = await bounds(images.nth(index));
        for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(after[key] - before[key])).toBeLessThan(1.5);
      }
    });
  }
}
