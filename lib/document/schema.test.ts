import { describe, it, expect } from 'vitest';
import { screenstylerDocSchema } from './schema';

const validDoc = {
  version: 1,
  canvas: {
    preset: 'free',
    width: 1600,
    height: 1000,
    background: { type: 'gradient', angle: 135, stops: [
      { color: '#6366f1', offset: 0 }, { color: '#ec4899', offset: 1 },
    ] },
  },
  content: {
    image: null,
    padding: 64,
    cornerRadius: 12,
    shadow: { x: 0, y: 30, blur: 60, spread: 0, color: '#000000', opacity: 0.35 },
    frame: { type: 'none' },
    transform3d: { rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 1500, scale: 1 },
  },
  annotations: [],
};

describe('screenstylerDocSchema', () => {
  it('parses a valid document', () => {
    expect(screenstylerDocSchema.parse(validDoc)).toEqual(validDoc);
  });

  it('rejects a document with the wrong version', () => {
    expect(() => screenstylerDocSchema.parse({ ...validDoc, version: 2 })).toThrow();
  });

  it('rejects a gradient background with fewer than two stops', () => {
    const bad = { ...validDoc, canvas: { ...validDoc.canvas,
      background: { type: 'gradient', angle: 0, stops: [{ color: '#000', offset: 0 }] } } };
    expect(() => screenstylerDocSchema.parse(bad)).toThrow();
  });
});
