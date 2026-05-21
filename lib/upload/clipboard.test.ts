import { describe, expect, it } from 'vitest';
import { imageFileFromClipboard, isEditablePasteTarget } from './clipboard';

function clipboardData(items: unknown[], files: File[] = []): DataTransfer {
  return { items, files } as unknown as DataTransfer;
}

describe('imageFileFromClipboard', () => {
  it('returns the first image file item from clipboard data', () => {
    const image = new File(['x'], 'shot.png', { type: 'image/png' });
    const data = clipboardData([
      { kind: 'string', type: 'text/plain', getAsFile: () => null },
      { kind: 'file', type: 'image/png', getAsFile: () => image },
    ]);

    expect(imageFileFromClipboard(data)).toBe(image);
  });

  it('falls back to clipboard files', () => {
    const image = new File(['x'], 'shot.webp', { type: 'image/webp' });
    const data = clipboardData([], [new File(['x'], 'note.txt', { type: 'text/plain' }), image]);

    expect(imageFileFromClipboard(data)).toBe(image);
  });

  it('returns null when there is no image', () => {
    const data = clipboardData([{ kind: 'string', type: 'text/plain', getAsFile: () => null }]);

    expect(imageFileFromClipboard(data)).toBeNull();
  });
});

describe('isEditablePasteTarget', () => {
  it('detects form fields', () => {
    expect(isEditablePasteTarget(document.createElement('input'))).toBe(true);
    expect(isEditablePasteTarget(document.createElement('textarea'))).toBe(true);
  });

  it('detects contenteditable elements', () => {
    const element = document.createElement('div');
    element.setAttribute('contenteditable', 'true');

    expect(isEditablePasteTarget(element)).toBe(true);
  });

  it('allows paste handling outside editable controls', () => {
    expect(isEditablePasteTarget(document.createElement('div'))).toBe(false);
  });
});
