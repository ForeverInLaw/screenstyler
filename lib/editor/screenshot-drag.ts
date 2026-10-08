import type { MouseEvent as ReactMouseEvent } from 'react';
import { useDocumentStore } from '@/lib/document/store';
import { useEditorUiStore } from './ui-store';
import { useInteractionStore } from './interaction-store';
import { selectionRect, screenshotRect } from './screenshot-geometry';
import { resizeScreenshotItems, type ResizeCorner } from './screenshot-resize';
import { alignScreenshotSelection, type AlignmentGuide } from './screenshot-alignment';
import { createContentCoordinates } from './content-coordinates';

export type ScreenshotTransform = 'move' | ResizeCorner;

/** Preview a selection in content coordinates and commit one document update. */
export function startScreenshotDrag(event: ReactMouseEvent, type: ScreenshotTransform, clickedId?: string) {
  if (event.button !== 0) return;
  const layout = event.currentTarget.closest<HTMLElement>('[data-screenshot-layout]');
  const { doc } = useDocumentStore.getState();
  const coordinates = layout && createContentCoordinates(layout, doc.canvas);
  if (!coordinates) return;
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.closest<HTMLElement>('[data-testid="document-frame"]')?.focus({ preventScroll: true });

  const ids = useEditorUiStore.getState().selectedScreenshotIds;
  const items = (doc.content.screenshots || []).filter((item) => ids.includes(item.id));
  const selection = selectionRect(items, doc.content.frame);
  if (!selection) return;
  const targets = (doc.content.screenshots || []).filter((item) => !ids.includes(item.id)).map((item) => screenshotRect(item, doc.content.frame));
  const start = { x: event.clientX, y: event.clientY };
  const origin = coordinates.point(start.x, start.y);
  let preview = items;
  let moved = false;

  const onMove = (move: MouseEvent) => {
    if (Math.hypot(move.clientX - start.x, move.clientY - start.y) < 3 && !moved) return;
    moved = true;
    const pointer = coordinates.point(move.clientX, move.clientY);
    const dx = pointer.x - origin.x;
    const dy = pointer.y - origin.y;
    const snap = (value: number) => doc.canvas.grid?.snap && !move.ctrlKey && !move.metaKey
      ? Math.round(value / doc.canvas.grid.size) * doc.canvas.grid.size : Math.round(value);
    let guides: AlignmentGuide[] = [];
    if (type === 'move') {
      const alignment = move.ctrlKey || move.metaKey ? { delta: { x: dx, y: dy }, guides: [] }
        : alignScreenshotSelection(selection, targets, { x: dx, y: dy }, coordinates.tolerance(move.clientX, move.clientY, 8));
      guides = alignment.guides;
      const alignedX = guides.some((guide) => guide.axis === 'x') ? alignment.delta.x : snap(selection.x + dx) - selection.x;
      const alignedY = guides.some((guide) => guide.axis === 'y') ? alignment.delta.y : snap(selection.y + dy) - selection.y;
      preview = items.map((item) => ({
        ...item, x: Math.round(item.x + alignedX), y: Math.round(item.y + alignedY),
      }));
    } else {
      preview = resizeScreenshotItems(items, doc.content.frame, type, dx, dy, snap);
    }
    useInteractionStore.getState().setPreviewItems(preview, guides);
  };

  const cleanup = () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    window.removeEventListener('blur', onCancel);
    window.removeEventListener('keydown', onKeyDown, true);
    useInteractionStore.getState().clearPreview();
  };
  const onCancel = () => cleanup();
  const onKeyDown = (key: KeyboardEvent) => {
    if (key.key !== 'Escape') return;
    key.preventDefault();
    key.stopImmediatePropagation();
    cleanup();
    useEditorUiStore.getState().setSelectedScreenshotId(null);
  };
  const onUp = () => {
    const changed = preview.some((item, index) => item.x !== items[index].x || item.y !== items[index].y
      || item.width !== items[index].width || item.height !== items[index].height);
    if (moved && changed) {
      useDocumentStore.getState().updateScreenshots(preview.map(({ id, x, y, width, height }) => ({
        id, updates: { x, y, width, height },
      })));
    } else if (!moved && clickedId) {
      useEditorUiStore.getState().setSelectedScreenshotId(clickedId);
    }
    cleanup();
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  window.addEventListener('blur', onCancel);
  window.addEventListener('keydown', onKeyDown, true);
}
