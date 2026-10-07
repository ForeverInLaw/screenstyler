import { test, expect, type Page } from '@playwright/test';
import { bounds, colourAt, drag, newCanvas, solidImageFixtures } from './canvas-fixtures';

async function overlapScene(page: Page) {
  await newCanvas(page);

  const screenshots = page.getByTestId('screenshot-item');
  await page.setInputFiles('input[type=file]', await solidImageFixtures(page, ['#dc2626', '#16a34a', '#2563eb']));
  await expect(screenshots).toHaveCount(3);
  for (const index of [2, 1]) {
    const box = await bounds(screenshots.nth(index));
    const start = { x: box.x + 8, y: box.y + box.height * 0.6 };
    await drag(page, start, { x: index * 20, y: -index * 40 });
  }
  return bounds(screenshots.first());
}


test('the selected lower screenshot keeps its toolbar clickable without changing image order', async ({ page }) => {
  const red = await overlapScene(page);
  const common = { x: red.x + red.width * 0.6, y: red.y + red.height * 0.4 };
  expect(await colourAt(page, common)).toEqual([37, 99, 235]);
  await page.mouse.click(red.x + 8, red.y + red.height * 0.6);
  expect(await colourAt(page, common)).toEqual([37, 99, 235]);

  await page.getByTitle('Crop image').click({ timeout: 3_000 });
  await expect(page.getByTestId('crop-region')).toBeVisible();
  await page.getByRole('button', { name: 'Done Cropping' }).click();
  expect(await colourAt(page, common)).toEqual([37, 99, 235]);
});

test('layer arrows move one screenshot at a time and Undo restores the previous order', async ({ page }) => {
  const red = await overlapScene(page);
  const middle = { x: red.x + 30, y: red.y + red.height * 0.6 };
  const common = { x: red.x + red.width * 0.6, y: red.y + red.height * 0.4 };
  await page.mouse.click(red.x + 8, red.y + red.height * 0.6);

  const forward = page.getByRole('button', { name: 'Bring forward one layer', exact: true });
  const backward = page.getByRole('button', { name: 'Send backward one layer', exact: true });
  expect(await colourAt(page, middle)).toEqual([22, 163, 74]);
  expect(await colourAt(page, common)).toEqual([37, 99, 235]);
  await forward.click();
  expect(await colourAt(page, common)).toEqual([37, 99, 235]);
  expect(await colourAt(page, middle)).toEqual([220, 38, 38]);

  await forward.click();
  expect(await colourAt(page, common)).toEqual([220, 38, 38]);
  await expect(forward).toBeDisabled();
  await backward.click();
  expect(await colourAt(page, common)).toEqual([37, 99, 235]);
  expect(await colourAt(page, middle)).toEqual([220, 38, 38]);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect(await colourAt(page, common)).toEqual([220, 38, 38]);
  await expect(forward).toBeDisabled();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect(await colourAt(page, common)).toEqual([37, 99, 235]);
  expect(await colourAt(page, middle)).toEqual([220, 38, 38]);
  await expect(forward).toBeEnabled();

  await backward.click();
  expect(await colourAt(page, middle)).toEqual([22, 163, 74]);
  expect(await colourAt(page, common)).toEqual([37, 99, 235]);
  await expect(backward).toBeDisabled();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect(await colourAt(page, middle)).toEqual([220, 38, 38]);
  expect(await colourAt(page, common)).toEqual([37, 99, 235]);
  await expect(backward).toBeEnabled();
});
