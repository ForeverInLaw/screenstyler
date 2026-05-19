import { describe, it, expect } from 'vitest';
import { canvasPresets, getCanvasPreset } from './canvas';
import { gradientPresets } from './gradients';
import { backgroundSchema } from '../document/schema';

describe('presets', () => {
  it('every canvas preset has positive dimensions', () => {
    for (const p of canvasPresets) {
      expect(p.width).toBeGreaterThan(0);
      expect(p.height).toBeGreaterThan(0);
    }
  });

  it('getCanvasPreset finds by id and returns undefined for unknown', () => {
    expect(getCanvasPreset('og')?.id).toBe('og');
    expect(getCanvasPreset('missing')).toBeUndefined();
  });

  it('every gradient preset background is schema-valid', () => {
    for (const g of gradientPresets) {
      expect(() => backgroundSchema.parse(g.background)).not.toThrow();
    }
  });
});
