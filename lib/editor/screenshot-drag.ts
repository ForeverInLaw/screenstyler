import type { MouseEvent as ReactMouseEvent } from 'react';
import { useDocumentStore } from '@/lib/document/store';
import { useEditorUiStore } from './ui-store';
import { useInteractionStore } from './interaction-store';
import { frameHeaderHeight, selectionRect } from './screenshot-geometry';

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
  const selection = selectionRect(items, doc.content.frame);
  if (!selection) return;
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
    if (type === 'move') {
      preview = items.map((item) => ({
        ...item, x: item.x + snap(selection.x + dx) - selection.x, y: item.y + snap(selection.y + dy) - selection.y,
      }));
    } else {
      const left = type === 'resize-tl' || type === 'resize-bl';
      const top = type === 'resize-tl' || type === 'resize-tr';
      const factor = Math.max(...items.map((item) => 40 / item.width), snap(selection.w + (left ? -dx : dx)) / selection.w);
      const pivot = { x: selection.x + (left ? selection.w : 0), y: selection.y + (top ? selection.h : 0) };
      const header = frameHeaderHeight(doc.content.frame);
      preview = items.map((item) => ({
        ...item,
        x: Math.round(pivot.x + (item.x - pivot.x) * factor),
        y: Math.round(pivot.y + (item.y - header - pivot.y) * factor + header),
        width: Math.round(item.width * factor), height: Math.round(item.height * factor),
      }));
    }
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
