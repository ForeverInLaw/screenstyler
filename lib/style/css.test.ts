import { describe, it, expect } from 'vitest';
import { backgroundToCss, shadowToCss, withAlpha } from './css';

describe('css helpers', () => {
  it('withAlpha converts hex to rgba', () => {
    expect(withAlpha('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
    expect(withAlpha('#ffffff', 1)).toBe('rgba(255, 255, 255, 1)');
  });

  it('backgroundToCss renders a solid color', () => {
    expect(backgroundToCss({ type: 'solid', color: '#abc123' })).toBe('#abc123');
  });

  it('backgroundToCss renders a linear gradient', () => {
    const css = backgroundToCss({ type: 'gradient', angle: 90,
      stops: [{ color: '#000', offset: 0 }, { color: '#fff', offset: 1 }] });
    expect(css).toBe('linear-gradient(90deg, #000 0%, #fff 100%)');
  });

  it('shadowToCss renders a box-shadow string', () => {
    expect(shadowToCss({ x: 0, y: 10, blur: 20, spread: 0,
      color: '#000000', opacity: 0.4 })).toBe('0px 10px 20px 0px rgba(0, 0, 0, 0.4)');
  });
});
