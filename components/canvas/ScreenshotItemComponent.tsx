'use client';
import React from 'react';
import { createPortal } from 'react-dom';
import type { ScreenshotItem, ScreenstylerDoc } from '@/lib/document/schema';
import { useDocumentStore } from '@/lib/document/store';
import { useEditorUiStore } from '@/lib/editor/ui-store';
import { FrameMockup } from './FrameMockup';
import { useObjectUrl } from './use-object-url';
import { ScreenshotCropEditor } from './ScreenshotCropEditor';
import { ScreenshotSelectionOverlay } from './ScreenshotSelectionOverlay';
import { ScreenshotActionsToolbar } from './ScreenshotActionsToolbar';
import { imageCropToStyle, shadowToCss } from '@/lib/style/css';
import { useInteractionStore } from '@/lib/editor/interaction-store';
import { screenshotRect, screenshotRectStyle } from '@/lib/editor/screenshot-geometry';
import { startScreenshotDrag, type ScreenshotTransform } from '@/lib/editor/screenshot-drag';
import { createContentCoordinates } from '@/lib/editor/content-coordinates';
import { useDocumentEdit } from '@/lib/editor/use-document-edit';

export type ScreenshotDragType =
  | ScreenshotTransform
  | 'crop-move'
  | 'crop-tl'
  | 'crop-tr'
  | 'crop-bl'
  | 'crop-br';

type Props = {
  item: ScreenshotItem;
  content: ScreenstylerDoc['content'];
  isPreview?: boolean;
  toolbarLayer?: HTMLElement | null;
};

export function ScreenshotItemComponent({ item: sourceItem, content, isPreview = false, toolbarLayer = null }: Props) {
  const item = useInteractionStore((s) => s.previewItems[sourceItem.id] ?? sourceItem);
  const doc = useDocumentStore((s) => s.doc);
  const edit = useDocumentEdit();
  const dragCleanup = React.useRef<(() => void) | null>(null);
  React.useEffect(() => () => dragCleanup.current?.(), []);
  const updateScreenshot = useDocumentStore((s) => s.updateScreenshot);
  const removeScreenshot = useDocumentStore((s) => s.removeScreenshot);
  const reorderScreenshot = useDocumentStore((s) => s.reorderScreenshot);

  const isSelected = useEditorUiStore((s) => s.selectedScreenshotIds.includes(item.id));
  const isSingleSelection = useEditorUiStore((s) =>
    doc.content.screenshots?.filter((screenshot) => s.selectedScreenshotIds.includes(screenshot.id)).length === 1);
  const toggleScreenshot = useEditorUiStore((s) => s.toggleScreenshot);
  const setSelectedScreenshotId = useEditorUiStore((s) => s.setSelectedScreenshotId);
  const isCropMode = useEditorUiStore((s) => s.isCropMode);
  const cropSession = useEditorUiStore((s) => s.cropSession);
  const beginCropSession = useEditorUiStore((s) => s.beginCrop);
  const endCropSession = useEditorUiStore((s) => s.endCrop);

  const url = useObjectUrl(item.image.blobKey);

  // Anchor geometry for this item's active crop, if any. The session lives in
  // the UI store and is committed back onto the item's box when it ends (see
  // endCrop/commitCrop), so nothing here is snapshotted into render-time refs.
  const cropStart = cropSession?.itemId === item.id ? cropSession : null;

  // Enter Crop Mode: capture the entry anchor (item.x/y are fixed while only
  // `crop` mutates, so it can't be re-derived mid-drag) and open the session.
  const beginCrop = () => {
    const scale = item.crop ? item.width / item.crop.w : item.width / item.image.naturalWidth;
    const cx = item.crop?.x ?? 0;
    const cy = item.crop?.y ?? 0;
    beginCropSession(item.id, { scale, imageX: item.x - cx * scale, imageY: item.y - cy * scale });
  };

  const handleDragStart = (e: React.MouseEvent, type: ScreenshotDragType) => {
    if (type === 'move' || type === 'resize-tl' || type === 'resize-tr' || type === 'resize-bl' || type === 'resize-br') {
      startScreenshotDrag(e, type, type === 'move' ? item.id : undefined);
      return;
    }
    if (e.button !== 0) return;
    const layout = e.currentTarget.closest<HTMLElement>('[data-screenshot-layout]');
    const coordinates = layout && createContentCoordinates(layout, doc.canvas);
    if (!coordinates || !cropStart) return;
    e.preventDefault();
    e.stopPropagation();

    dragCleanup.current?.();
    edit.begin();

    const origin = coordinates.point(e.clientX, e.clientY);

    const initialCrop = item.crop ? { ...item.crop } : { x: 0, y: 0, w: item.image.naturalWidth, h: item.image.naturalHeight };

    const onMouseMove = (moveEvent: MouseEvent) => {
      // Map the content-plane delta into source-image pixels using the crop entry scale.
      const pointer = coordinates.point(moveEvent.clientX, moveEvent.clientY);
      const ndx = (pointer.x - origin.x) / cropStart.scale;
      const ndy = (pointer.y - origin.y) / cropStart.scale;

      let cx = initialCrop.x;
      let cy = initialCrop.y;
      let cw = initialCrop.w;
      let ch = initialCrop.h;

      if (type === 'crop-move') {
        cx = Math.max(0, Math.min(item.image.naturalWidth - cw, Math.round(initialCrop.x + ndx)));
        cy = Math.max(0, Math.min(item.image.naturalHeight - ch, Math.round(initialCrop.y + ndy)));
      } else if (type === 'crop-br') {
        cw = Math.max(20, Math.min(item.image.naturalWidth - cx, Math.round(initialCrop.w + ndx)));
        ch = Math.max(20, Math.min(item.image.naturalHeight - cy, Math.round(initialCrop.h + ndy)));
      } else if (type === 'crop-tl') {
        const nextCx = Math.max(0, Math.min(initialCrop.x + initialCrop.w - 20, Math.round(initialCrop.x + ndx)));
        cw = initialCrop.w + (initialCrop.x - nextCx);
        cx = nextCx;
        const nextCy = Math.max(0, Math.min(initialCrop.y + initialCrop.h - 20, Math.round(initialCrop.y + ndy)));
        ch = initialCrop.h + (initialCrop.y - nextCy);
        cy = nextCy;
      } else if (type === 'crop-tr') {
        cw = Math.max(20, Math.min(item.image.naturalWidth - cx, Math.round(initialCrop.w + ndx)));
        const nextCy = Math.max(0, Math.min(initialCrop.y + initialCrop.h - 20, Math.round(initialCrop.y + ndy)));
        ch = initialCrop.h + (initialCrop.y - nextCy);
        cy = nextCy;
      } else if (type === 'crop-bl') {
        const nextCx = Math.max(0, Math.min(initialCrop.x + initialCrop.w - 20, Math.round(initialCrop.x + ndx)));
        cw = initialCrop.w + (initialCrop.x - nextCx);
        cx = nextCx;
        ch = Math.max(20, Math.min(item.image.naturalHeight - cy, Math.round(initialCrop.h + ndy)));
      }

      updateScreenshot(item.id, { crop: { x: cx, y: cy, w: cw, h: ch } });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      window.removeEventListener('blur', onMouseUp);
      dragCleanup.current = null;
      edit.commit();
    };

    dragCleanup.current = onMouseUp;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('blur', onMouseUp);
  };

  if (!url) return null;

  // Visual layout if cropping
  if (isSelected && isCropMode && !isPreview && cropStart) {
    return (
      <ScreenshotCropEditor
        url={url}
        item={item}
        canvasWidth={doc.canvas.width}
        canvasHeight={doc.canvas.height}
        cropStart={cropStart}
        onDragStart={handleDragStart}
        onDone={endCropSession}
      />
    );
  }

  // Normal / Render mode
  const screenshots = content.screenshots || [];
  const layerIndex = screenshots.findIndex((screenshot) => screenshot.id === item.id);
  const screenshotStyle = screenshotRectStyle(screenshotRect(item, content.frame), doc.canvas.width, doc.canvas.height);
  return (
    <div
      data-testid="screenshot-item"
      onClick={(e) => {
        if (isPreview) return;
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        if (isPreview || e.button !== 0) return;
        if (e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.closest<HTMLElement>('[data-testid="document-frame"]')?.focus({ preventScroll: true });
          toggleScreenshot(item.id);
          return;
        }
        if (!isSelected) setSelectedScreenshotId(item.id);
        handleDragStart(e, 'move');
      }}
      style={{
        ...screenshotStyle,
        cursor: 'default',
        pointerEvents: 'auto',
        zIndex: Math.max(0, layerIndex),
        boxSizing: 'border-box',
      }}
    >
      {/* Frame and screenshot wrapper */}
      <FrameMockup
        frame={content.frame}
        shadow={content.shadow}
        cornerRadius={content.cornerRadius}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: content.frame.type === 'none' ? `${content.cornerRadius}px` : 0,
          }}
        >
          {item.crop ? (
            <img
              data-testid="screenshot"
              src={url}
              alt=""
              style={{
                position: 'absolute',
                ...imageCropToStyle(item.image, item.crop),
                maxWidth: 'none',
                maxHeight: 'none',
                display: 'block',
                userSelect: 'none',
                pointerEvents: 'none',
                borderRadius: content.frame.type === 'none' ? `${content.cornerRadius}px` : undefined,
                boxShadow: content.frame.type === 'none' ? shadowToCss(content.shadow) : undefined,
              }}
            />
          ) : (
            <img
              data-testid="screenshot"
              src={url}
              alt=""
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: content.frame.type === 'device' ? 'cover' : 'fill',
                userSelect: 'none',
                pointerEvents: 'none',
                borderRadius: content.frame.type === 'none' ? `${content.cornerRadius}px` : undefined,
                boxShadow: content.frame.type === 'none' ? shadowToCss(content.shadow) : undefined,
              }}
            />
          )}
        </div>
      </FrameMockup>

      {/* Editor bounds overlay (hidden in preview) */}
      {isSelected && !isSingleSelection && !isPreview && (
        <ScreenshotSelectionOverlay content={content} />
      )}
      {isSelected && isSingleSelection && !isPreview && toolbarLayer && createPortal(
        <div style={{ ...screenshotStyle, pointerEvents: 'none' }}>
          <ScreenshotSelectionOverlay content={content} onDragStart={handleDragStart} />
          <ScreenshotActionsToolbar
            onCrop={beginCrop}
            onMoveForward={layerIndex >= 0 && layerIndex < screenshots.length - 1
              ? () => reorderScreenshot(item.id, 'forward') : undefined}
            onMoveBackward={layerIndex > 0
              ? () => reorderScreenshot(item.id, 'backward') : undefined}
            onDelete={() => {
              removeScreenshot(item.id);
              setSelectedScreenshotId(null);
            }}
          />
        </div>,
        toolbarLayer,
      )}
    </div>
  );
}
