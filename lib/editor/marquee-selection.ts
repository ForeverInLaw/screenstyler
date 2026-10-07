import type { MouseEvent as ReactMouseEvent } from 'react';
import { useDocumentStore } from '@/lib/document/store';
import { useEditorUiStore } from './ui-store';
import { useInteractionStore } from './interaction-store';
import { screenshotRect } from './screenshot-geometry';

/** Select screenshots intersecting a rectangle drawn from empty canvas. */
export function startMarqueeSelection(event: ReactMouseEvent<HTMLDivElement>) {
  if (event.button !== 0) return;
  const layout = event.currentTarget.querySelector<HTMLElement>('[data-screenshot-layout]');
  const box = layout?.getBoundingClientRect();
  if (!box?.width || !box.height) return;
  event.preventDefault();
  event.currentTarget.focus({ preventScroll: true });
  const ui = useEditorUiStore.getState();
  ui.endCrop();
  const { doc } = useDocumentStore.getState();
  const original = ui.selectedScreenshotIds;
  const base = event.shiftKey ? original : [];
  const point = (x: number, y: number) => ({
    x: (x - box.x) * doc.canvas.width / box.width,
    y: (y - box.y) * doc.canvas.height / box.height,
  });
  const start = point(event.clientX, event.clientY);
  let moved = false;
  ui.setSelectedScreenshotIds(base);

  const onMove = (move: MouseEvent) => {
    if (!moved && Math.hypot(move.clientX - event.clientX, move.clientY - event.clientY) < 3) return;
    moved = true;
    const end = point(move.clientX, move.clientY);
    const rect = { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), w: Math.abs(end.x - start.x), h: Math.abs(end.y - start.y) };
    const hits = (doc.content.screenshots || []).filter((item) => {
      const image = screenshotRect(item, doc.content.frame);
      return rect.x < image.x + image.w && rect.x + rect.w > image.x && rect.y < image.y + image.h && rect.y + rect.h > image.y;
    });
    useInteractionStore.getState().setMarquee(rect);
    useEditorUiStore.getState().setSelectedScreenshotIds([...base, ...hits.map((item) => item.id)]);
  };
  const cleanup = () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', cleanup);
    window.removeEventListener('blur', onCancel);
    window.removeEventListener('keydown', onKeyDown, true);
    useInteractionStore.getState().setMarquee(null);
  };
  const onCancel = () => {
    useEditorUiStore.getState().setSelectedScreenshotIds(original);
    cleanup();
  };
  const onKeyDown = (key: KeyboardEvent) => {
    if (key.key !== 'Escape') return;
    key.preventDefault();
    key.stopImmediatePropagation();
    useEditorUiStore.getState().setSelectedScreenshotIds([]);
    cleanup();
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', cleanup);
  window.addEventListener('blur', onCancel);
  window.addEventListener('keydown', onKeyDown, true);
}
