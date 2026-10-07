import { test, expect, type Locator, type Page } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 1000 } });

async function bounds(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Screenshot is not visible');
  return box;
}

async function drag(page: Page, from: { x: number; y: number }, delta: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + delta.x, from.y + delta.y, { steps: 5 });
  await page.mouse.up();
}

async function scene(page: Page) {
  await page.goto('/projects');
  await page.getByRole('button', { name: 'New project' }).click();
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page).toHaveURL(/\/editor\?id=/);
  await page.getByRole('button', { name: 'Free', exact: true }).click();
  await page.getByRole('slider', { name: 'Shadow opacity', exact: true }).press('Home');

  const files = [];
  for (const [index, colour] of ['#dc2626', '#16a34a', '#2563eb'].entries()) {
    const png = await page.evaluate((fill) => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas context unavailable');
      context.fillStyle = fill;
      context.fillRect(0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png').split(',')[1];
    }, colour);
    files.push({ name: `selection-${index}.png`, mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  }
  await page.setInputFiles('input[type=file]', files);
  const images = page.getByTestId('screenshot-item');
  await expect(images).toHaveCount(3);
  await page.keyboard.down('Control');
  for (const [index, dx] of [[2, 100], [1, -100]]) {
    const box = await bounds(images.nth(index));
    await drag(page, { x: box.x + 8, y: box.y + box.height * 0.6 }, { x: dx, y: -80 });
  }
  await page.keyboard.up('Control');
  return images;
}

async function selectPair(page: Page, images: Locator) {
  const green = await bounds(images.nth(1));
  const blue = await bounds(images.nth(2));
  await images.nth(1).click({ position: { x: 8, y: green.height * 0.6 } });
  await images.nth(2).click({ position: { x: blue.width - 8, y: blue.height * 0.6 }, modifiers: ['Shift'] });
  await expect(page.getByRole('status', { name: 'Screenshot selection' })).toHaveText('2 selected');
}

function expectSameBox(actual: Awaited<ReturnType<typeof bounds>>, expected: Awaited<ReturnType<typeof bounds>>) {
  for (const key of ['x', 'y', 'width', 'height'] as const) {
    expect(Math.abs(actual[key] - expected[key]), `Preserve ${key}`).toBeLessThan(1.5);
  }
}

test('Shift selection moves and deletes only the selected screenshots with one Undo per edit', async ({ page }) => {
  const images = await scene(page);
  await selectPair(page, images);
  await expect(page.getByTitle('Crop image')).toHaveCount(0);
  const original = await Promise.all([0, 1, 2].map((index) => bounds(images.nth(index))));
  await page.keyboard.down('Control');
  await drag(page, { x: original[1].x + 8, y: original[1].y + original[1].height * 0.6 }, { x: 40, y: 30 });
  await page.keyboard.up('Control');
  expectSameBox(await bounds(images.nth(0)), original[0]);
  for (const index of [1, 2]) {
    expectSameBox(await bounds(images.nth(index)), { ...original[index], x: original[index].x + 40, y: original[index].y + 30 });
  }
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  for (const index of [0, 1, 2]) expectSameBox(await bounds(images.nth(index)), original[index]);

  await page.getByRole('button', { name: 'Delete 2 screenshots', exact: true }).click();
  await expect(images).toHaveCount(1);
  expectSameBox(await bounds(images.first()), original[0]);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(images).toHaveCount(3);
  for (const index of [0, 1, 2]) expectSameBox(await bounds(images.nth(index)), original[index]);
});
