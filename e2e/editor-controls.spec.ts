import { test, expect, type Page } from '@playwright/test';
import { newCanvas, solidImageFixtures } from './canvas-fixtures';

async function createComposition(page: Page) {
  await newCanvas(page);
  const [shot] = await solidImageFixtures(page, ['#e8b66b']);
  await page.locator('input[type=file]').first().setInputFiles(shot);
  await expect(page.getByTestId('screenshot-item')).toHaveCount(1);
}

async function dragControl(page: Page, from: { x: number; y: number }, to: { x: number; y: number }, touch: boolean) {
  if (touch) {
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
    for (let i = 1; i <= 8; i++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: from.x + (to.x - from.x) * i / 8, y: from.y + (to.y - from.y) * i / 8 }],
      });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await session.detach();
  } else {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 8 });
    await page.mouse.up();
  }
}

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test.describe(`continuous controls at width ${viewport.width}`, () => {
    const touch = viewport.width < 500;
    test.use({ viewport, hasTouch: touch, isMobile: touch });

    test('slider gestures and numeric edits each undo in one step', async ({ page }) => {
      await createComposition(page);
      const group = page.getByRole('group', { name: 'Padding', exact: true });
      await group.scrollIntoViewIfNeeded();
      const track = (await group.locator('.studio-slider-track').boundingBox())!;
      const thumb = (await group.locator('.studio-slider-thumb').boundingBox())!;
      const input = page.getByRole('textbox', { name: 'Padding value', exact: true });
      await dragControl(page,
        { x: thumb.x + thumb.width / 2, y: thumb.y + thumb.height / 2 },
        { x: track.x + track.width * 0.75, y: track.y + track.height / 2 }, touch);
      await expect(input).toHaveValue('300');
      await page.getByRole('button', { name: 'Undo', exact: true }).click();
      await expect(input).toHaveValue('64');
      await page.getByRole('button', { name: 'Redo', exact: true }).click();
      await expect(input).toHaveValue('300');

      await input.fill('200');
      await input.press('Tab');
      await expect(input).toHaveValue('200');
      await page.getByRole('button', { name: 'Undo', exact: true }).click();
      await expect(input).toHaveValue('300');

      const scale = page.getByRole('textbox', { name: 'Scale value', exact: true });
      await scale.fill('1.25');
      await scale.press('Tab');
      await expect(page.getByRole('slider', { name: 'Scale', exact: true })).toHaveAttribute('aria-valuenow', '1.25');
      await scale.press('Shift+ArrowUp');
      await expect(scale).toHaveValue('1.75');
      await page.getByRole('slider', { name: 'Scale', exact: true }).press('Shift+ArrowLeft');
      await expect(scale).toHaveValue('1.25');
      await scale.fill('99');
      await scale.press('Tab');
      await expect(scale).toHaveValue('2');
      await scale.fill('invalid');
      await scale.press('Tab');
      await expect(scale).toHaveValue('2');
    });

    test('color edits support HEX, keyboard, touch, focus, and one Undo per gesture', async ({ page }) => {
      await createComposition(page);
      const trigger = page.getByRole('button', { name: 'Gradient start color', exact: true });
      await trigger.click();
      const popup = page.getByRole('dialog', { name: 'Gradient start color', exact: true });
      const hex = popup.getByRole('textbox', { name: 'Gradient start color HEX', exact: true });
      const original = await hex.inputValue();
      await hex.fill('#123456');
      await hex.press('Enter');
      await expect(trigger).toBeFocused();
      await page.getByRole('button', { name: 'Undo', exact: true }).click();
      await trigger.click();
      await expect(hex).toHaveValue(original);
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Redo', exact: true }).click();
      await trigger.click();
      await expect(hex).toHaveValue('#123456');
      await hex.fill('invalid');
      await popup.getByRole('button', { name: 'Close color picker' }).click();
      await trigger.click();
      await expect(hex).toHaveValue('#123456');

      const hue = popup.getByRole('slider', { name: 'Hue', exact: true });
      await hue.focus();
      await hue.press('Delete');
      await expect(page.getByTestId('screenshot-item')).toHaveCount(1);
      await hue.press('ArrowRight');
      await expect(hex).not.toHaveValue('#123456');
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
      await page.getByRole('button', { name: 'Undo', exact: true }).click();
      await trigger.click();
      await expect(hex).toHaveValue('#123456');

      const area = (await popup.locator('.react-colorful__saturation').boundingBox())!;
      await dragControl(page,
        { x: area.x + area.width * 0.3, y: area.y + area.height * 0.3 },
        { x: area.x + area.width * 0.8, y: area.y + area.height * 0.8 }, touch);
      const changed = await hex.inputValue();
      expect(changed).not.toBe('#123456');
      await popup.getByRole('button', { name: 'Close color picker' }).click();
      await page.getByRole('button', { name: 'Undo', exact: true }).click();
      await trigger.click();
      await expect(hex).toHaveValue('#123456');
      const bounds = (await popup.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    });
  });
}
