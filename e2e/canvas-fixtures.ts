import { expect, type Locator, type Page } from '@playwright/test';

export async function bounds(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Canvas element is not visible');
  return box;
}

export async function newCanvas(page: Page) {
  await page.goto('/projects');
  await page.getByRole('button', { name: 'New project' }).click();
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page).toHaveURL(/\/editor\?id=/);
  await page.getByRole('button', { name: 'Free', exact: true }).click();
  await page.getByRole('slider', { name: 'Shadow opacity', exact: true }).press('Home');
}

export async function solidImageFixtures(page: Page, colours: readonly string[]) {
  const files = [];
  for (const [index, colour] of colours.entries()) {
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
    files.push({ name: `screenshot-${index}.png`, mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  }
  return files;
}

export async function drag(page: Page, from: { x: number; y: number }, delta: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + delta.x, from.y + delta.y, { steps: 5 });
  await page.mouse.up();
}

export async function colourAt(page: Page, point: { x: number; y: number }) {
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
