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

for (const grouped of [false, true]) {
  test(`keyboard resize keeps the opposite corner anchored for ${grouped ? 'framed groups' : 'single screenshots'}`, async ({ page }) => {
    const images = await scene(page, grouped);
    if (grouped) {
      await page.getByRole('combobox', { name: 'Type:', exact: true }).click();
      await page.getByRole('option', { name: 'Window Frame', exact: true }).click();
    }
    const selection = grouped ? page.getByTestId('screenshot-group-selection') : images.first();
    const before = await bounds(selection);
    const anchor = await pointOn(selection, { x: 0, y: 0 });
    const handle = page.getByRole('button', { name: 'Resize from bottom-right corner' });
    await handle.focus();
    await expect(handle).toBeFocused();
    await handle.press('Shift+ArrowRight');
    expect((await bounds(selection)).width).toBeGreaterThan(before.width);
    expectPoint(await pointOn(selection, { x: 0, y: 0 }), anchor);
    await page.keyboard.press('Control+z');
    expect(Math.abs((await bounds(selection)).width - before.width)).toBeLessThan(1.5);
  });
}

for (const mode of ['single', 'group', 'framed group'] as const) {
  for (const corner of mode === 'framed group' ? corners.slice(0, 1) : corners) {
    test(`vertical-only resize changes a ${mode} from its ${corner.name} corner`, async ({ page }) => {
      const grouped = mode !== 'single';
      const images = await scene(page, grouped);
      if (mode === 'framed group') {
        await page.getByRole('combobox', { name: 'Type:', exact: true }).click();
        await page.getByRole('option', { name: 'Window Frame', exact: true }).click();
      }
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

for (const tilted of [false, true]) {
  test(`crop corners and movement follow the pointer with ${tilted ? 'perspective' : 'rotation'}`, async ({ page }) => {
    const images = await scene(page);
    await page.getByRole('slider', { name: 'Scale', exact: true }).press('Home');
    await page.getByRole('slider', { name: 'Rotate Z', exact: true }).press('End');
    if (tilted) {
      await page.getByRole('slider', { name: 'Rotate X', exact: true }).press('End');
      await page.getByRole('slider', { name: 'Rotate Y', exact: true }).press('End');
    }
    await images.first().screenshot();
    await page.getByTitle('Crop image').click();
    const editor = page.getByTestId('screenshot-crop-editor');
    const region = page.getByTestId('crop-region');
    const start = await pointOn(region, { x: 0, y: 0 });
    const target = await pointOn(editor, { x: 0.2, y: 0.15 });
    const opposite = await pointOn(region, { x: 1, y: 1 });
    await drag(page, start, { x: target.x - start.x, y: target.y - start.y });
    expectPoint(await pointOn(region, { x: 0, y: 0 }), target);
    expectPoint(await pointOn(region, { x: 1, y: 1 }), opposite);

    const center = await pointOn(region, { x: 0.5, y: 0.5 });
    const movedCenter = await pointOn(editor, { x: 0.52, y: 0.525 });
    await drag(page, center, { x: movedCenter.x - center.x, y: movedCenter.y - center.y });
    expectPoint(await pointOn(region, { x: 0.5, y: 0.5 }), movedCenter);
    const layout = page.locator('[data-screenshot-layout]');
    const origin = await pointOn(layout, { x: 0, y: 0 });
    const selected = await Promise.all([{ x: 0, y: 0 }, { x: 1, y: 1 }].map((corner) => pointOn(region, corner)));
    const expected = selected.map((point) => ({ x: point.x - origin.x, y: point.y - origin.y }));
    // Clicking a button can scroll clipped ancestors; compare within the same content plane.
    const expectSelection = async (selection: ReturnType<Page['getByTestId']>) => {
      const origin = await pointOn(layout, { x: 0, y: 0 });
      for (const [index, corner] of [{ x: 0, y: 0 }, { x: 1, y: 1 }].entries()) {
        const point = await pointOn(selection, corner);
        expectPoint({ x: point.x - origin.x, y: point.y - origin.y }, expected[index]);
      }
    };
    await page.getByRole('button', { name: 'Done Cropping', exact: true }).click();
    await expectSelection(images.first());
    await page.getByTitle('Crop image').click();
    await expectSelection(region);
    await page.getByRole('button', { name: 'Done Cropping', exact: true }).click();
  });
}

for (const grouped of [false, true]) {
  test(`overlapping annotations leave ${grouped ? 'group' : 'single-image'} actions and resize handles clickable`, async ({ page }) => {
    const images = await scene(page, grouped);
    const original = await bounds(images.first());
    await page.getByRole('button', { name: 'Highlight', exact: true }).click();
    await drag(page, { x: original.x - 15, y: original.y - 60 }, { x: original.width + 30, y: original.height + 80 });
    await page.getByRole('button', { name: 'Select', exact: true }).click();
    await page.keyboard.press('Control+a');
    const selection = grouped ? page.getByTestId('screenshot-group-selection') : images.first();
    const deleteButton = page.getByRole('button', { name: grouped ? 'Delete 2 screenshots' : 'Delete screenshot', exact: true });
    await deleteButton.click({ trial: true });
    const grip = await pointOn(selection, { x: 1, y: 1 });
    await drag(page, grip, { x: 40, y: 30 });
    expect((await bounds(images.first())).width).toBeGreaterThan(original.width + 20);
    await deleteButton.click();
    await expect(images).toHaveCount(0);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(images).toHaveCount(grouped ? 2 : 1);
    expect((await bounds(images.first())).width).toBeGreaterThan(original.width + 20);
  });
}
