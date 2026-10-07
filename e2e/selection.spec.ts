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

async function scene(page: Page, count = 3) {
  await page.goto('/projects');
  await page.getByRole('button', { name: 'New project' }).click();
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page).toHaveURL(/\/editor\?id=/);
  await page.getByRole('button', { name: 'Free', exact: true }).click();
  await page.getByRole('slider', { name: 'Shadow opacity', exact: true }).press('Home');

  const files = [];
  for (const [index, colour] of ['#dc2626', '#16a34a', '#2563eb', '#eab308'].slice(0, count).entries()) {
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
  await expect(images).toHaveCount(count);
  await page.keyboard.down('Control');
  const placements = [{ index: 2, dx: 100, dy: -80 }, { index: 1, dx: -100, dy: -80 }];
  if (count === 4) placements.unshift({ index: 3, dx: 40, dy: -120 });
  for (const { index, dx, dy } of placements) {
    const box = await bounds(images.nth(index));
    await drag(page, { x: box.x + 8, y: box.y + box.height * 0.6 }, { x: dx, y: dy });
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

async function colourAt(page: Page, point: { x: number; y: number }) {
  const png = await page.screenshot({ clip: { x: Math.floor(point.x), y: Math.floor(point.y), width: 1, height: 1 } });
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

test('Escape cancels a drag preview without adding a document history step', async ({ page }) => {
  const images = await scene(page);
  await selectPair(page, images);
  const original = await Promise.all([0, 1, 2].map((index) => bounds(images.nth(index))));
  const start = { x: original[1].x + 8, y: original[1].y + original[1].height * 0.6 };
  await page.keyboard.down('Control');
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 40, start.y + 30, { steps: 5 });
  expect((await bounds(images.nth(1))).x).toBeGreaterThan(original[1].x + 20);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await page.keyboard.up('Control');
  for (const index of [0, 1, 2]) expectSameBox(await bounds(images.nth(index)), original[index]);
  await expect(page.getByRole('status', { name: 'Screenshot selection' })).toHaveCount(0);
  await expect(page.getByTestId('alignment-guide')).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expectSameBox(await bounds(images.nth(1)), original[0]);
  expectSameBox(await bounds(images.nth(2)), original[2]);
});

test('resizing a selection preserves image proportions and spacing and Undo restores it', async ({ page }) => {
  const images = await scene(page);
  await selectPair(page, images);
  const original = await Promise.all([0, 1, 2].map((index) => bounds(images.nth(index))));
  const group = await bounds(page.getByTestId('screenshot-group-selection'));
  const factor = 1.15;
  await drag(page, { x: group.x + group.width, y: group.y + group.height }, {
    x: group.width * (factor - 1), y: group.height * (factor - 1),
  });
  expectSameBox(await bounds(images.nth(0)), original[0]);
  for (const index of [1, 2]) {
    expectSameBox(await bounds(images.nth(index)), {
      x: group.x + (original[index].x - group.x) * factor,
      y: group.y + (original[index].y - group.y) * factor,
      width: original[index].width * factor,
      height: original[index].height * factor,
    });
  }
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  for (const index of [0, 1, 2]) expectSameBox(await bounds(images.nth(index)), original[index]);
});

for (const grouped of [false, true]) {
  test(`resizing framed ${grouped ? 'selections' : 'screenshots'} keeps the opposite corner fixed`, async ({ page }) => {
    const images = await scene(page);
    await page.getByRole('combobox', { name: 'Type:', exact: true }).selectOption('window');
    if (grouped) await selectPair(page, images);
    else await images.nth(2).click({ position: { x: 20, y: 100 } });
    const selection = grouped ? page.getByTestId('screenshot-group-selection') : images.nth(2);
    const original = await bounds(selection);
    await drag(page, { x: original.x, y: original.y }, { x: original.width * 0.15, y: original.height * 0.15 });
    const resized = await bounds(selection);
    expect(resized.width).toBeLessThan(original.width - 10);
    expect(Math.abs(resized.x + resized.width - original.x - original.width)).toBeLessThan(1.5);
    expect(Math.abs(resized.y + resized.height - original.y - original.height)).toBeLessThan(1.5);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    expectSameBox(await bounds(selection), original);
  });
}

test('a selected pair advances one layer without reversing its internal order', async ({ page }) => {
  const images = await scene(page, 4);
  const red = await bounds(images.nth(0));
  const green = await bounds(images.nth(1));
  const blue = await bounds(images.nth(2));
  const yellow = await bounds(images.nth(3));
  const common = { x: red.x + red.width * 0.6, y: red.y + red.height * 0.2 };
  const lower = { x: common.x, y: (yellow.y + yellow.height + blue.y + blue.height) / 2 };
  await images.nth(0).click({ position: { x: red.width / 2, y: red.height - 12 } });
  await images.nth(1).click({ position: { x: 8, y: green.height * 0.6 }, modifiers: ['Shift'] });
  await expect(page.getByRole('status', { name: 'Screenshot selection' })).toHaveText('2 selected');
  const forward = page.getByRole('button', { name: 'Bring forward one layer', exact: true });
  const backward = page.getByRole('button', { name: 'Send backward one layer', exact: true });

  expect(await colourAt(page, lower)).toEqual([37, 99, 235]);
  expect(await colourAt(page, common)).toEqual([234, 179, 8]);
  await expect(forward).toBeEnabled();
  await forward.click();
  expect(await colourAt(page, lower)).toEqual([22, 163, 74]);
  expect(await colourAt(page, common)).toEqual([234, 179, 8]);
  await forward.click();
  expect(await colourAt(page, common)).toEqual([22, 163, 74]);
  await expect(forward).toBeDisabled();
  await backward.click();
  expect(await colourAt(page, common)).toEqual([234, 179, 8]);
  expect(await colourAt(page, lower)).toEqual([22, 163, 74]);
  await backward.click();
  expect(await colourAt(page, lower)).toEqual([37, 99, 235]);
  await expect(backward).toBeDisabled();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect(await colourAt(page, lower)).toEqual([22, 163, 74]);
  expect(await colourAt(page, common)).toEqual([234, 179, 8]);
});

test('marquee selection and keyboard shortcuts preserve unselected images and editable controls', async ({ page }) => {
  const images = await scene(page);
  const red = await bounds(images.nth(0));
  const green = await bounds(images.nth(1));
  const blue = await bounds(images.nth(2));
  await page.keyboard.press('Escape');
  const start = { x: green.x - 12, y: green.y - 12 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(blue.x + blue.width + 12, red.y - 12, { steps: 5 });
  await expect(page.getByTestId('selection-marquee')).toBeVisible();
  await page.mouse.up();
  await expect(page.getByRole('status', { name: 'Screenshot selection' })).toHaveText('2 selected');
  expectSameBox(await bounds(images.nth(0)), red);

  await page.getByRole('slider', { name: 'Padding', exact: true }).focus();
  await page.keyboard.press('Control+a');
  await expect(page.getByRole('status', { name: 'Screenshot selection' })).toHaveText('2 selected');
  await page.getByRole('button', { name: 'Select', exact: true }).click();
  await page.keyboard.press('Control+a');
  await expect(page.getByRole('status', { name: 'Screenshot selection' })).toHaveText('3 selected');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('status', { name: 'Screenshot selection' })).toHaveCount(0);

  await selectPair(page, images);
  await page.keyboard.press('Delete');
  await expect(images).toHaveCount(1);
  expectSameBox(await bounds(images.first()), red);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(images).toHaveCount(3);
});

for (const zoomed of [false, true]) {
  test(`alignment guides snap edges and group centres${zoomed ? ' with padding and zoom' : ''}`, async ({ page }) => {
    const images = await scene(page);
    if (zoomed) {
      await page.getByRole('slider', { name: 'Padding', exact: true }).press('PageUp');
      await page.getByRole('slider', { name: 'Scale', exact: true }).press('ArrowLeft');
      await images.nth(2).hover();
      await page.keyboard.down('Alt');
      await page.mouse.wheel(0, -80);
      await page.keyboard.up('Alt');
      await images.nth(0).screenshot();
    }
    const red = await bounds(images.nth(0));
    const original = await bounds(images.nth(2));
    const start = { x: original.x + original.width - 20, y: original.y + original.height * 0.6 };
    const nearTop = { x: start.x, y: start.y + red.y - original.y + 6 };
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(nearTop.x, nearTop.y, { steps: 5 });
    await expect(page.getByTestId('alignment-guide').first()).toBeVisible();
    expect(Math.abs((await bounds(images.nth(2))).y - red.y)).toBeLessThan(1.5);
    await page.mouse.up();
    await expect(page.getByTestId('alignment-guide')).toHaveCount(0);
    expect(Math.abs((await bounds(images.nth(2))).y - red.y)).toBeLessThan(1.5);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    expectSameBox(await bounds(images.nth(2)), original);

    await page.keyboard.down('Control');
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(nearTop.x, nearTop.y, { steps: 5 });
    await expect(page.getByTestId('alignment-guide')).toHaveCount(0);
    expect(Math.abs((await bounds(images.nth(2))).y - red.y - 6)).toBeLessThan(1.5);
    await page.mouse.up();
    await page.keyboard.up('Control');
    await page.getByRole('button', { name: 'Undo', exact: true }).click();

    const blue = await bounds(images.nth(2));
    await images.nth(2).click({ position: { x: blue.width - 20, y: blue.height * 0.6 } });
    await drag(page, { x: blue.x + blue.width, y: blue.y + blue.height }, { x: -blue.width * 0.3, y: -blue.height * 0.3 });
    const small = await bounds(images.nth(2));
    const lowerStart = { x: small.x + small.width - 20, y: small.y + small.height * 0.6 };
    await page.mouse.move(lowerStart.x, lowerStart.y);
    await page.mouse.down();
    await page.mouse.move(lowerStart.x, lowerStart.y + red.y + red.height - small.y - small.height + 6, { steps: 5 });
    await expect(page.getByTestId('alignment-guide').first()).toBeVisible();
    const atBottom = await bounds(images.nth(2));
    expect(Math.abs(atBottom.y + atBottom.height - red.y - red.height)).toBeLessThan(1.5);
    await page.mouse.up();
    await page.getByRole('button', { name: 'Undo', exact: true }).click();

    await selectPair(page, images);
    const group = await bounds(page.getByTestId('screenshot-group-selection'));
    const green = await bounds(images.nth(1));
    const groupStart = { x: green.x + 8, y: green.y + green.height * 0.6 };
    await page.mouse.move(groupStart.x, groupStart.y);
    await page.mouse.down();
    await page.mouse.move(groupStart.x + red.x + red.width / 2 - group.x - group.width / 2 + 6,
      groupStart.y + red.y - group.y + 6, { steps: 5 });
    await expect(page.getByTestId('alignment-guide')).toHaveCount(2);
    const aligned = await bounds(page.getByTestId('screenshot-group-selection'));
    expect(Math.abs(aligned.x + aligned.width / 2 - red.x - red.width / 2)).toBeLessThan(1.5);
    expect(Math.abs(aligned.y - red.y)).toBeLessThan(1.5);
    await page.mouse.up();
    await expect(page.getByTestId('alignment-guide')).toHaveCount(0);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    expectSameBox(await bounds(page.getByTestId('screenshot-group-selection')), group);
  });
}
