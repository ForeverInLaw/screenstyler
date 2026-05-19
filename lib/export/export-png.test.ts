import { describe, it, expect } from 'vitest';
import { exportFilename } from './export-png';

describe('exportFilename', () => {
  it('slugifies the project name and appends scale', () => {
    expect(exportFilename('My Cool Shot', 2)).toBe('my-cool-shot@2x.png');
  });

  it('falls back to "screenstyler" for an empty name', () => {
    expect(exportFilename('  ', 1)).toBe('screenstyler@1x.png');
  });
});
