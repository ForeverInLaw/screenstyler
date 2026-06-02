'use client';
import React from 'react';
import type { ScreenshotItem, ScreenstylerDoc, Frame } from '@/lib/document/schema';
import { useDocumentStore } from '@/lib/document/store';
import { useEditorUiStore } from '@/lib/editor/ui-store';
import { FrameMockup } from './FrameMockup';
import { useObjectUrl } from './use-object-url';
import { ScreenshotCropEditor } from './ScreenshotCropEditor';
import { ScreenshotSelectionOverlay } from './ScreenshotSelectionOverlay';
import { shadowToCss } from '@/lib/style/css';

export type ScreenshotDragType =
  | 'move'
  | 'resize-tl'
  | 'resize-tr'
  | 'resize-bl'
  | 'resize-br'
  | 'crop-move'
  | 'crop-tl'
  | 'crop-tr'
  | 'crop-bl'
  | 'crop-br';

type Props = {
  item: ScreenshotItem;
  content: ScreenstylerDoc['content'];
  isPreview?: boolean;
};

function getHeaderHeight(frame: Frame) {
  if (frame.type === 'window') return 32;
  if (frame.type === 'browser') {
    if (frame.variant === 'safari') return 42;
    if (frame.variant === 'chrome') return 70;
  }
  return 0;
}

export function ScreenshotItemComponent({ item, content, isPreview = false }: Props) {
  const doc = useDocumentStore((s) => s.doc);
  const updateScreenshot = useDocumentStore((s) => s.updateScreenshot);
  const removeScreenshot = useDocumentStore((s) => s.removeScreenshot);
  const reorderScreenshot = useDocumentStore((s) => s.reorderScreenshot);

  const selectedScreenshotId = useEditorUiStore((s) => s.selectedScreenshotId);
  const setSelectedScreenshotId = useEditorUiStore((s) => s.setSelectedScreenshotId);
  const isCropMode = useEditorUiStore((s) => s.isCropMode);
  const cropSession = useEditorUiStore((s) => s.cropSession);
  const beginCropSession = useEditorUiStore((s) => s.beginCrop);
  const endCropSession = useEditorUiStore((s) => s.endCrop);

  const isSelected = selectedScreenshotId === item.id;
  const url = useObjectUrl(item.image.blobKey);

  const headerH = getHeaderHeight(content.frame);
  const renderY = item.y - headerH;
  const renderH = item.height + headerH;

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

  const crop = item.crop || { x: 0, y: 0, w: item.image.naturalWidth, h: item.image.naturalHeight };
  const scaleX = item.width / crop.w;
  const scaleY = item.height / crop.h;

  const fullW = item.image.naturalWidth * scaleX;
  const fullH = item.image.naturalHeight * scaleY;
  const offsetX = -crop.x * scaleX;
  const offsetY = -crop.y * scaleY;

  const handleDragStart = (e: React.MouseEvent, type: ScreenshotDragType) => {
    if (e.button === 1) return;
    e.preventDefault();
    e.stopPropagation();

    useDocumentStore.temporal.getState().pause();

    const startX = e.clientX;
    const startY = e.clientY;

    const initialItem = { ...item };
    const initialCrop = item.crop ? { ...item.crop } : { x: 0, y: 0, w: item.image.naturalWidth, h: item.image.naturalHeight };

    const frameEl = document.querySelector('[data-testid="document-frame"]');
    const scale = frameEl ? frameEl.getBoundingClientRect().width / doc.canvas.width : 1;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;

      const snap = doc.canvas.grid?.snap;
      const gridSize = doc.canvas.grid?.size || 20;

      const snapValue = (val: number) => {
        return snap ? Math.round(val / gridSize) * gridSize : Math.round(val);
      };

      if (type === 'move') {
        const nextX = snapValue(initialItem.x + dx);
        const nextY = snapValue(initialItem.y + dy);
        updateScreenshot(item.id, { x: nextX, y: nextY });
      } else if (type === 'resize-br') {
        const nextW = Math.max(40, snapValue(initialItem.width + dx));
        const aspect = initialItem.width / initialItem.height;
        const nextH = Math.round(nextW / aspect);
        updateScreenshot(item.id, { width: nextW, height: nextH });
      } else if (type === 'resize-bl') {
        const nextW = Math.max(40, snapValue(initialItem.width - dx));
        const aspect = initialItem.width / initialItem.height;
        const nextH = Math.round(nextW / aspect);
        const nextX = initialItem.x + (initialItem.width - nextW);
        updateScreenshot(item.id, { x: nextX, width: nextW, height: nextH });
      } else if (type === 'resize-tr') {
        const nextW = Math.max(40, snapValue(initialItem.width + dx));
        const aspect = initialItem.width / initialItem.height;
        const nextH = Math.round(nextW / aspect);
        const nextY = initialItem.y + (initialItem.height - nextH);
        updateScreenshot(item.id, { y: nextY, width: nextW, height: nextH });
      } else if (type === 'resize-tl') {
        const nextW = Math.max(40, snapValue(initialItem.width - dx));
        const aspect = initialItem.width / initialItem.height;
        const nextH = Math.round(nextW / aspect);
        const nextX = initialItem.x + (initialItem.width - nextW);
        const nextY = initialItem.y + (initialItem.height - nextH);
        updateScreenshot(item.id, { x: nextX, y: nextY, width: nextW, height: nextH });
      } else {
        // Crop Mode calculations in natural pixels
        const displayScale = cropStart?.scale || 1;
        const displayToNaturalScale = 1 / displayScale;
        const ndx = dx * displayToNaturalScale;
        const ndy = dy * displayToNaturalScale;

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
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      const temporal = useDocumentStore.temporal.getState();
      temporal.resume();
      const state = useDocumentStore.getState();
      useDocumentStore.setState({ doc: { ...state.doc } });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
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
  return (
    <div
      data-testid="screenshot-item"
      onClick={(e) => {
        if (isPreview) return;
        e.stopPropagation();
        setSelectedScreenshotId(item.id);
      }}
      onMouseDown={(e) => {
        if (isPreview || e.button === 1) return;
        setSelectedScreenshotId(item.id);
        handleDragStart(e, 'move');
      }}
      style={{
        position: 'absolute',
        left: `${(item.x / doc.canvas.width) * 100}%`,
        top: `${(renderY / doc.canvas.height) * 100}%`,
        width: `${(item.width / doc.canvas.width) * 100}%`,
        height: `${(renderH / doc.canvas.height) * 100}%`,
        cursor: 'default',
        pointerEvents: 'auto',
        zIndex: (() => {
          const screenshots = content.screenshots || [];
          const idx = screenshots.findIndex((s) => s.id === item.id);
          return idx >= 0 ? idx : 0;
        })(),
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
                left: `${offsetX}px`,
                top: `${offsetY}px`,
                width: `${fullW}px`,
                height: `${fullH}px`,
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
      {isSelected && !isPreview && (
        <ScreenshotSelectionOverlay
          content={content}
          onDragStart={handleDragStart}
          onCrop={beginCrop}
          onReorderFront={() => reorderScreenshot(item.id, 'front')}
          onReorderBack={() => reorderScreenshot(item.id, 'back')}
          onDelete={() => {
            removeScreenshot(item.id);
            setSelectedScreenshotId(null);
          }}
        />
      )}
    </div>
  );
}
