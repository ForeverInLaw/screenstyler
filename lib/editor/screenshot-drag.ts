import type { MouseEvent as ReactMouseEvent } from 'react';
import { useDocumentStore } from '@/lib/document/store';
import { useEditorUiStore } from './ui-store';
import { useInteractionStore } from './interaction-store';

export type ScreenshotTransform = 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br';

/** Preview a selection in content coordinates and commit one document update. */
export function startScreenshotDrag(event: ReactMouseEvent, type: ScreenshotTransform, clickedId?: string) {
  if (event.button !== 0) return;
  const layout = event.currentTarget.closest<HTMLElement>('[data-screenshot-layout]');
  const box = layout?.getBoundingClientRect();
  if (!box?.width || !box.height) return;
  event.preventDefault();
  event.stopPropagation();

  const { doc } = useDocumentStore.getState();
  const ids = useEditorUiStore.getState().selectedScreenshotIds;
  const items = (doc.content.screenshots || []).filter((item) => ids.includes(item.id));
  if (!items.length) return;
  const start = { x: event.clientX, y: event.clientY };
  let preview = items;
  let moved = false;

  const onMove = (move: MouseEvent) => {
    if (Math.hypot(move.clientX - start.x, move.clientY - start.y) < 3 && !moved) return;
    moved = true;
    const dx = (move.clientX - start.x) * doc.canvas.width / box.width;
    const dy = (move.clientY - start.y) * doc.canvas.height / box.height;
    const snap = (value: number) => doc.canvas.grid?.snap && !move.ctrlKey && !move.metaKey
      ? Math.round(value / doc.canvas.grid.size) * doc.canvas.grid.size : Math.round(value);
    preview = items.map((item) => {
      if (type === 'move') return {
        ...item, x: item.x + snap(items[0].x + dx) - items[0].x, y: item.y + snap(items[0].y + dy) - items[0].y,
      };
      const left = type === 'resize-tl' || type === 'resize-bl';
      const top = type === 'resize-tl' || type === 'resize-tr';
      const width = Math.max(40, snap(item.width + (left ? -dx : dx)));
      const height = Math.round(width * item.height / item.width);
      return { ...item, width, height, x: item.x + (left ? item.width - width : 0), y: item.y + (top ? item.height - height : 0) };
    });
    useInteractionStore.getState().setPreviewItems(preview);
  };

  const cleanup = () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    window.removeEventListener('blur', onCancel);
    useInteractionStore.getState().clearPreview();
  };
  const onCancel = () => cleanup();
  const onUp = () => {
    if (moved) {
      useDocumentStore.getState().updateScreenshots(preview.map(({ id, x, y, width, height }) => ({
        id, updates: { x, y, width, height },
      })));
    } else if (clickedId) {
      useEditorUiStore.getState().setSelectedScreenshotId(clickedId);
    }
    cleanup();
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  window.addEventListener('blur', onCancel);
}
