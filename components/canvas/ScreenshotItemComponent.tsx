'use client';
import React, { useRef } from 'react';
import {
  IconCrop,
  IconCheck,
  IconTrash,
  IconChevronUp,
  IconChevronDown,
} from '@tabler/icons-react';
import type { ScreenshotItem, ScreenstylerDoc, Frame } from '@/lib/document/schema';
import { useDocumentStore } from '@/lib/document/store';
import { useEditorUiStore } from '@/lib/editor/ui-store';
import { FrameMockup } from './FrameMockup';
import { useObjectUrl } from './use-object-url';
import { shadowToCss } from '@/lib/style/css';

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
  const setIsCropMode = useEditorUiStore((s) => s.setIsCropMode);

  const isSelected = selectedScreenshotId === item.id;
  const url = useObjectUrl(item.image.blobKey);

  const headerH = getHeaderHeight(content.frame);
  const renderY = item.y - headerH;
  const renderH = item.height + headerH;

  const crop = item.crop || { x: 0, y: 0, w: item.image.naturalWidth, h: item.image.naturalHeight };
  const scaleX = item.width / crop.w;
  const scaleY = item.height / crop.h;

  const fullW = item.image.naturalWidth * scaleX;
  const fullH = item.image.naturalHeight * scaleY;
  const offsetX = -crop.x * scaleX;
  const offsetY = -crop.y * scaleY;

  const handleDragStart = (
    e: React.MouseEvent,
    type:
      | 'move'
      | 'resize-tl'
      | 'resize-tr'
      | 'resize-bl'
      | 'resize-br'
      | 'crop-move'
      | 'crop-tl'
      | 'crop-tr'
      | 'crop-bl'
      | 'crop-br'
  ) => {
    e.preventDefault();
    e.stopPropagation();

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
        const displayToNaturalScale = item.image.naturalWidth / fullW;
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
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  if (!url) return null;

  // Visual layout if cropping
  if (isSelected && isCropMode && !isPreview) {
    const editorX = item.x + offsetX;
    const editorY = item.y + offsetY;

    return (
      <div
        data-testid="screenshot-crop-editor"
        style={{
          position: 'absolute',
          left: `${(editorX / doc.canvas.width) * 100}%`,
          top: `${(editorY / doc.canvas.height) * 100}%`,
          width: `${(fullW / doc.canvas.width) * 100}%`,
          height: `${(fullH / doc.canvas.height) * 100}%`,
          zIndex: 100,
          pointerEvents: 'auto',
        }}
      >
        {/* Dimmed Background Image */}
        <img
          src={url}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0.35,
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />

        {/* Cropped Active Box */}
        <div
          onMouseDown={(e) => handleDragStart(e, 'crop-move')}
          style={{
            position: 'absolute',
            left: `${-offsetX}px`,
            top: `${-offsetY}px`,
            width: `${item.width}px`,
            height: `${item.height}px`,
            outline: '2px solid #818cf8',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
            cursor: 'move',
            overflow: 'hidden',
          }}
        >
          {/* Fully Lit Offset Image */}
          <img
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
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Crop Bounding Border Overlay with Handles */}
        <div
          style={{
            position: 'absolute',
            left: `${-offsetX}px`,
            top: `${-offsetY}px`,
            width: `${item.width}px`,
            height: `${item.height}px`,
            pointerEvents: 'none',
          }}
        >
          {/* L-shaped Crop Corners */}
          <div
            onMouseDown={(e) => handleDragStart(e, 'crop-tl')}
            style={{
              position: 'absolute',
              left: -4,
              top: -4,
              width: 16,
              height: 16,
              borderLeft: '4px solid #ffffff',
              borderTop: '4px solid #ffffff',
              cursor: 'nwse-resize',
              pointerEvents: 'auto',
            }}
          />
          <div
            onMouseDown={(e) => handleDragStart(e, 'crop-tr')}
            style={{
              position: 'absolute',
              right: -4,
              top: -4,
              width: 16,
              height: 16,
              borderRight: '4px solid #ffffff',
              borderTop: '4px solid #ffffff',
              cursor: 'nesw-resize',
              pointerEvents: 'auto',
            }}
          />
          <div
            onMouseDown={(e) => handleDragStart(e, 'crop-bl')}
            style={{
              position: 'absolute',
              left: -4,
              bottom: -4,
              width: 16,
              height: 16,
              borderLeft: '4px solid #ffffff',
              borderBottom: '4px solid #ffffff',
              cursor: 'nesw-resize',
              pointerEvents: 'auto',
            }}
          />
          <div
            onMouseDown={(e) => handleDragStart(e, 'crop-br')}
            style={{
              position: 'absolute',
              right: -4,
              bottom: -4,
              width: 16,
              height: 16,
              borderRight: '4px solid #ffffff',
              borderBottom: '4px solid #ffffff',
              cursor: 'nwse-resize',
              pointerEvents: 'auto',
            }}
          />
        </div>

        {/* Floating Done Button */}
        <div
          className="hide-on-export"
          style={{
            position: 'absolute',
            left: `${-offsetX + item.width / 2}px`,
            top: `${-offsetY + item.height + 16}px`,
            transform: 'translateX(-50%)',
            background: 'rgba(15, 17, 21, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 99,
            padding: '6px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 'bold',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          }}
        >
          <button
            type="button"
            onClick={() => setIsCropMode(false)}
            style={{
              background: '#6366f1',
              border: 'none',
              color: '#ffffff',
              padding: '4px 12px',
              borderRadius: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <IconCheck size={14} />
            Done Cropping
          </button>
        </div>
      </div>
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
        if (isPreview) return;
        handleDragStart(e, 'move');
      }}
      style={{
        position: 'absolute',
        left: `${(item.x / doc.canvas.width) * 100}%`,
        top: `${(renderY / doc.canvas.height) * 100}%`,
        width: `${(item.width / doc.canvas.width) * 100}%`,
        height: `${(renderH / doc.canvas.height) * 100}%`,
        cursor: isPreview ? 'default' : 'move',
        pointerEvents: 'auto',
        zIndex: isSelected ? 10 : 2,
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
            aspectRatio: `${item.width} / ${item.height}`,
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
                objectFit: 'cover',
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
        <>
          {/* Border highlight */}
          <div
            style={{
              position: 'absolute',
              inset: -2,
              border: '2px solid #6366f1',
              borderRadius: content.frame.type === 'none' ? `${content.cornerRadius + 2}px` : '14px',
              pointerEvents: 'none',
            }}
          />

          {/* Corner Resize Handles */}
          <div
            onMouseDown={(e) => handleDragStart(e, 'resize-tl')}
            style={{
              position: 'absolute',
              left: -6,
              top: -6,
              width: 12,
              height: 12,
              background: '#ffffff',
              border: '2px solid #6366f1',
              borderRadius: '50%',
              cursor: 'nwse-resize',
            }}
          />
          <div
            onMouseDown={(e) => handleDragStart(e, 'resize-tr')}
            style={{
              position: 'absolute',
              right: -6,
              top: -6,
              width: 12,
              height: 12,
              background: '#ffffff',
              border: '2px solid #6366f1',
              borderRadius: '50%',
              cursor: 'nesw-resize',
            }}
          />
          <div
            onMouseDown={(e) => handleDragStart(e, 'resize-bl')}
            style={{
              position: 'absolute',
              left: -6,
              bottom: -6,
              width: 12,
              height: 12,
              background: '#ffffff',
              border: '2px solid #6366f1',
              borderRadius: '50%',
              cursor: 'nesw-resize',
            }}
          />
          <div
            onMouseDown={(e) => handleDragStart(e, 'resize-br')}
            style={{
              position: 'absolute',
              right: -6,
              bottom: -6,
              width: 12,
              height: 12,
              background: '#ffffff',
              border: '2px solid #6366f1',
              borderRadius: '50%',
              cursor: 'nwse-resize',
            }}
          />

          {/* Floating Actions Toolbar (Glassmorphism layout) */}
          <div
            className="hide-on-export"
            onMouseDown={(e) => e.stopPropagation()} // Prevent dragging from starting when clicking toolbar buttons
            onClick={(e) => e.stopPropagation()} // Prevent resetting selection and crop mode when clicking buttons
            style={{
              position: 'absolute',
              left: '50%',
              top: -50,
              transform: 'translateX(-50%)',
              background: 'rgba(23, 25, 35, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
              zIndex: 1000,
            }}
          >
            <button
              type="button"
              onClick={() => setIsCropMode(true)}
              title="Crop image"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#e5e7eb',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
              }}
            >
              <IconCrop size={15} />
              <span>Crop</span>
            </button>
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
            <button
              type="button"
              onClick={() => reorderScreenshot(item.id, 'front')}
              title="Bring to Front"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#e5e7eb',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 6,
              }}
            >
              <IconChevronUp size={15} />
            </button>
            <button
              type="button"
              onClick={() => reorderScreenshot(item.id, 'back')}
              title="Send to Back"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#e5e7eb',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 6,
              }}
            >
              <IconChevronDown size={15} />
            </button>
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
            <button
              type="button"
              onClick={() => {
                removeScreenshot(item.id);
                setSelectedScreenshotId(null);
              }}
              title="Delete screenshot"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f87171',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 6,
              }}
            >
              <IconTrash size={15} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
