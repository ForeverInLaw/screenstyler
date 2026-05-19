import { describe, it, expect } from 'vitest';
import { validateImageFile } from './load-image';

function file(name: string, type: string, size: number): File {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

describe('validateImageFile', () => {
  it('accepts a png under the size limit', () => {
    expect(validateImageFile(file('a.png', 'image/png', 1000))).toEqual({ ok: true });
  });

  it('rejects a non-image file', () => {
    const result = validateImageFile(file('a.pdf', 'application/pdf', 1000));
    expect(result).toEqual({ ok: false, reason: 'UNSUPPORTED_TYPE' });
  });

  it('rejects a file over 25 MB', () => {
    const result = validateImageFile(file('big.png', 'image/png', 26 * 1024 * 1024));
    expect(result).toEqual({ ok: false, reason: 'TOO_LARGE' });
  });
});
