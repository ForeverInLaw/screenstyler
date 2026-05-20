import type { Frame, Shadow, Transform3D } from '../document/schema';

export type StylePreset = {
  id: string;
  label: string;
  padding: number;
  cornerRadius: number;
  shadow: Shadow;
  frame: Frame;
  transform3d: Transform3D;
};

export const stylePresets: StylePreset[] = [
  {
    id: 'modern-floating',
    label: 'Modern Floating',
    padding: 64,
    cornerRadius: 16,
    shadow: { x: 0, y: 30, blur: 60, spread: 0, color: '#000000', opacity: 0.3 },
    frame: { type: 'none' },
    transform3d: { rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 1500, scale: 1 },
  },
  {
    id: 'sleek-mac-window',
    label: 'macOS Window',
    padding: 80,
    cornerRadius: 12,
    shadow: { x: 0, y: 25, blur: 50, spread: 0, color: '#000000', opacity: 0.35 },
    frame: { type: 'window', variant: 'macos' },
    transform3d: { rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 1500, scale: 1 },
  },
  {
    id: '3d-floating-perspective',
    label: '3D Perspective',
    padding: 96,
    cornerRadius: 12,
    shadow: { x: 15, y: 25, blur: 40, spread: 0, color: '#000000', opacity: 0.25 },
    frame: { type: 'window', variant: 'macos-dark' },
    transform3d: { rotateX: 15, rotateY: -20, rotateZ: 5, perspective: 1000, scale: 0.95 },
  },
  {
    id: 'mock-safari-browser',
    label: 'Safari Browser',
    padding: 48,
    cornerRadius: 0,
    shadow: { x: 0, y: 15, blur: 30, spread: 0, color: '#000000', opacity: 0.2 },
    frame: {
      type: 'browser',
      variant: 'safari',
      url: 'screenstyler.com',
      theme: 'light',
    },
    transform3d: { rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 1500, scale: 1 },
  },
  {
    id: 'mobile-mockup',
    label: 'iPhone Bezel',
    padding: 64,
    cornerRadius: 0,
    shadow: { x: 0, y: 20, blur: 40, spread: 0, color: '#000000', opacity: 0.3 },
    frame: { type: 'device', variant: 'iphone' },
    transform3d: { rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 1500, scale: 1 },
  },
];
