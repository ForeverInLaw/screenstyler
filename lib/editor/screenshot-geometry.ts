import type { CSSProperties } from 'react';
import type { Frame, Rect, ScreenshotItem } from '@/lib/document/schema';

export function frameHeaderHeight(frame: Frame) {
  if (frame.type === 'window') return 32;
  if (frame.type === 'browser' && frame.variant === 'safari') return 42;
  if (frame.type === 'browser' && frame.variant === 'chrome') return 70;
  return 0;
}

export function screenshotRect(item: ScreenshotItem, frame: Frame): Rect {
  const header = frameHeaderHeight(frame);
  return { x: item.x, y: item.y - header, w: item.width, h: item.height + header };
}

export function selectionRect(items: readonly ScreenshotItem[], frame: Frame): Rect | null {
  if (!items.length) return null;
  const boxes = items.map((item) => screenshotRect(item, frame));
  const x = Math.min(...boxes.map((box) => box.x));
  const y = Math.min(...boxes.map((box) => box.y));
  return {
    x, y,
    w: Math.max(...boxes.map((box) => box.x + box.w)) - x,
    h: Math.max(...boxes.map((box) => box.y + box.h)) - y,
  };
}

export function screenshotRectStyle(box: Rect, canvasWidth: number, canvasHeight: number): CSSProperties {
  return {
    position: 'absolute',
    left: `${box.x / canvasWidth * 100}%`,
    top: `${box.y / canvasHeight * 100}%`,
    width: `${box.w / canvasWidth * 100}%`,
    height: `${box.h / canvasHeight * 100}%`,
  };
}
