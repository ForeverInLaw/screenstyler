import type { Frame, ScreenshotItem } from '@/lib/document/schema';
import { frameHeaderHeight, selectionRect } from './screenshot-geometry';
import { useDocumentStore } from '@/lib/document/store';
import { useEditorUiStore } from './ui-store';

export type ResizeCorner = 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br';

/** Resize proportionally around the opposite corner, keeping frame headers fixed. */
export function resizeScreenshotItems(items: ScreenshotItem[], frame: Frame, corner: ResizeCorner, dx: number, dy: number, snap = Math.round) {
  const selection = selectionRect(items, frame);
  if (!selection) return items;
  const left = corner === 'resize-tl' || corner === 'resize-bl';
  const top = corner === 'resize-tl' || corner === 'resize-tr';
  const header = frameHeaderHeight(frame);
  const scalableHeight = selection.h - header;
  const dw = left ? -dx : dx;
  const dh = top ? -dy : dy;
  const requested = Math.abs(dw / selection.w) >= Math.abs(dh / scalableHeight)
    ? snap(selection.w + dw) / selection.w : snap(scalableHeight + dh) / scalableHeight;
  const factor = Math.max(...items.map((item) => 40 / item.width), requested);
  const pivot = { x: selection.x + (left ? selection.w : 0), y: selection.y + (top ? selection.h : 0) };
  const headerOffset = top ? 0 : header;
  return items.map((item) => ({
    ...item,
    x: Math.round(pivot.x + (item.x - pivot.x) * factor),
    y: Math.round(pivot.y + (item.y - headerOffset - pivot.y) * factor + headerOffset),
    width: Math.round(item.width * factor), height: Math.round(item.height * factor),
  }));
}

export function resizeSelectionWithKeyboard(event: KeyboardEvent, corner: ResizeCorner) {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
  if (!direction) return;
  event.preventDefault();
  event.stopPropagation();
  const { doc, updateScreenshots } = useDocumentStore.getState();
  const ids = useEditorUiStore.getState().selectedScreenshotIds;
  const items = (doc.content.screenshots ?? []).filter((item) => ids.includes(item.id));
  const step = event.shiftKey ? 10 : 1;
  const resized = resizeScreenshotItems(items, doc.content.frame, corner, direction[0] * step, direction[1] * step);
  updateScreenshots(resized.map(({ id, x, y, width, height }) => ({ id, updates: { x, y, width, height } })));
}
