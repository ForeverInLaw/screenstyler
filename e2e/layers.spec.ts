import { test, expect, type Locator, type Page } from '@playwright/test';

async function bounds(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Screenshot is not visible');
  return box;
}

async function overlapScene(page: Page) {
  await page.goto('/projects');
  await page.getByRole('button', { name: 'New project' }).click();
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page).toHaveURL(/\/editor\?id=/);
  await page.getByRole('button', { name: 'Free', exact: true }).click();
  await page.getByRole('slider', { name: 'Shadow opacity', exact: true }).press('Home');

  const screenshots = page.getByTestId('screenshot-item');
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
    files.push({
      name: `layer-${index}.png`, mimeType: 'image/png', buffer: Buffer.from(png, 'base64'),
    });
  }
  await page.setInputFiles('input[type=file]', files);
  await expect(screenshots).toHaveCount(3);
  for (const index of [2, 1]) {
    const box = await bounds(screenshots.nth(index));
    const start = { x: box.x + 8, y: box.y + box.height * 0.6 };
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + index * 20, start.y - index * 40, { steps: 5 });
    await page.mouse.up();
  }
  return bounds(screenshots.first());
}

async function colourAt(page: Page, point: { x: number; y: number }) {
  const png = await page.screenshot({
    clip: { x: Math.floor(point.x), y: Math.floor(point.y), width: 1, height: 1 },
  });
  return page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas context unavailable');
    context.drawImage(image, 0, 0);
    return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
  }, png.toString('base64'));
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
