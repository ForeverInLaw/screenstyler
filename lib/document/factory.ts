import type { ScreenstylerDoc } from './schema';

export function createBlankDoc(): ScreenstylerDoc {
  return {
    version: 1,
    canvas: {
      preset: 'free',
      width: 1600,
      height: 1000,
      background: { type: 'gradient', angle: 135, stops: [
        { color: '#6366f1', offset: 0 },
        { color: '#ec4899', offset: 1 },
      ] },
      grid: { visible: false, size: 20, snap: false },
    },
    content: {
      image: null,
      screenshots: [],
      padding: 64,
      cornerRadius: 12,
      shadow: { x: 0, y: 30, blur: 60, spread: 0, color: '#000000', opacity: 0.35 },
      frame: { type: 'none' },
      transform3d: { rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 1500, scale: 1 },
    },
    annotations: [],
  };
}
