import { test, expect, type Locator, type Page } from '@playwright/test';

async function imageFixture(page: Page) {
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas context unavailable');
    const image = context.createImageData(canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const offset = (y * canvas.width + x) * 4;
        image.data.set([Math.round(x * 255 / 800), Math.round(y * 255 / 600), 100, 255], offset);
      }
    }
    context.putImageData(image, 0, 0);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  return { name: 'crop-gradient.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') };
}

async function bounds(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Image region is not visible');
  return box;
}

function expectSameBounds(actual: Awaited<ReturnType<typeof bounds>>, expected: Awaited<ReturnType<typeof bounds>>) {
  for (const key of ['x', 'y', 'width', 'height'] as const) {
    expect(Math.abs(actual[key] - expected[key]), `Crop ${key} should be preserved`).toBeLessThan(1.5);
  }
}

async function pixels(page: Page, png: Buffer) {
  return page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas context unavailable');
    context.drawImage(image, 0, 0);
    return [0.17, 0.47, 0.83].flatMap((y) =>
      [0.17, 0.47, 0.83].map((x) => Array.from(
        context.getImageData(Math.floor(x * image.width), Math.floor(y * image.height), 1, 1).data,
      )),
    );
  }, png.toString('base64'));
}

function expectSamePixels(actual: number[][], expected: number[][]) {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((pixel, index) => {
    pixel.forEach((channel, component) => {
      // Subpixel rasterization can move a sample by one source pixel.
      expect(Math.abs(channel - expected[index][component])).toBeLessThanOrEqual(2);
    });
  });
}

async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 5 });
  await page.mouse.up();
}

for (const preset of ['Free', 'Instagram Post']) {
  test(`cropping preserves the selected image region on ${preset}`, async ({ page }) => {
    await page.goto('/projects');
    await page.getByRole('button', { name: 'New project' }).click();
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page).toHaveURL(/\/editor\?id=/);
    await page.getByRole('button', { name: preset, exact: true }).click();
    await page.setInputFiles('input[type=file]', await imageFixture(page));

    const screenshot = page.getByTestId('screenshot-item');
    if (preset === 'Instagram Post') {
      await page.getByRole('slider', { name: 'Padding', exact: true }).press('PageUp');
      await page.getByRole('slider', { name: 'Scale', exact: true }).press('ArrowLeft');
      await screenshot.hover();
      await page.keyboard.down('Alt');
      await page.mouse.wheel(0, -80);
      await page.keyboard.up('Alt');
    }
    await screenshot.screenshot(); // Wait for the content scale transition to settle.
    const original = await bounds(screenshot);
    await screenshot.click();
    await page.getByTitle('Crop image').click();
    const region = page.getByTestId('crop-region');
    const full = await bounds(region);
    expectSameBounds(full, original);
    await drag(page, { x: full.x + 2, y: full.y + 2 }, {
      x: full.x + full.width / 4,
      y: full.y + full.height / 4,
    });

    const selected = await bounds(region);
    expect(selected.width).toBeLessThan(full.width - 20);
    // Mouse events and source-image coordinates round to whole pixels.
    expect(Math.abs(selected.x - (full.x + full.width / 4 - 2))).toBeLessThan(1.5);
    expect(Math.abs(selected.y - (full.y + full.height / 4 - 2))).toBeLessThan(1.5);
    const previewPixels = await pixels(page, await region.screenshot());
    await page.getByRole('button', { name: 'Done Cropping' }).click();

    const committed = await bounds(screenshot);
    expectSameBounds(committed, selected);
    expectSamePixels(await pixels(page, await screenshot.screenshot()), previewPixels);

    await page.getByTitle('Crop image').click();
    const reopened = await bounds(region);
    expectSameBounds(reopened, committed);
    expectSamePixels(await pixels(page, await region.screenshot()), previewPixels);

    const center = { x: reopened.x + reopened.width / 2, y: reopened.y + reopened.height / 2 };
    await drag(page, center, { x: center.x - 20, y: center.y - 15 });
    const moved = await bounds(region);
    expect(Math.abs(moved.x - (reopened.x - 20))).toBeLessThan(1.5);
    expect(Math.abs(moved.y - (reopened.y - 15))).toBeLessThan(1.5);
    const movedPixels = await pixels(page, await region.screenshot());
    await page.getByRole('button', { name: 'Done Cropping' }).click();
    expectSameBounds(await bounds(screenshot), moved);
    expectSamePixels(await pixels(page, await screenshot.screenshot()), movedPixels);
  });
}
