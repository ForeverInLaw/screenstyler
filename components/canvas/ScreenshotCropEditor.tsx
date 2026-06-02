'use client';
import React from 'react';
import { IconCheck } from '@tabler/icons-react';
import type { ScreenshotItem } from '@/lib/document/schema';
import type { ScreenshotDragType } from './ScreenshotItemComponent';

type Props = {
  url: string;
  item: ScreenshotItem;
  canvasWidth: number;
  canvasHeight: number;
  cropStart: { scale: number; imageX: number; imageY: number };
  onDragStart: (e: React.MouseEvent, type: ScreenshotDragType) => void;
  onDone: () => void;
};

/**
 * Full-bleed crop editor: dimmed source image with a fully-lit, draggable
 * crop box and corner handles. Rendered only while a screenshot is selected
 * and crop mode is active.
 */
export function ScreenshotCropEditor({
  url,
  item,
  canvasWidth,
  canvasHeight,
  cropStart,
  onDragStart,
  onDone,
}: Props) {
  const { scale: displayScale, imageX, imageY } = cropStart;
  const currentCrop = item.crop || { x: 0, y: 0, w: item.image.naturalWidth, h: item.image.naturalHeight };

  return (
    <div
      data-testid="screenshot-crop-editor"
      style={{
        position: 'absolute',
        left: `${(imageX / canvasWidth) * 100}%`,
        top: `${(imageY / canvasHeight) * 100}%`,
        width: `${((item.image.naturalWidth * displayScale) / canvasWidth) * 100}%`,
        height: `${((item.image.naturalHeight * displayScale) / canvasHeight) * 100}%`,
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
        onMouseDown={(e) => onDragStart(e, 'crop-move')}
        style={{
          position: 'absolute',
          left: `${currentCrop.x * displayScale}px`,
          top: `${currentCrop.y * displayScale}px`,
          width: `${currentCrop.w * displayScale}px`,
          height: `${currentCrop.h * displayScale}px`,
          outline: '2px solid #818cf8',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
          cursor: 'default',
          overflow: 'hidden',
        }}
      >
        {/* Fully Lit Offset Image */}
        <img
          src={url}
          alt=""
          style={{
            position: 'absolute',
            left: `${-currentCrop.x * displayScale}px`,
            top: `${-currentCrop.y * displayScale}px`,
            width: `${item.image.naturalWidth * displayScale}px`,
            height: `${item.image.naturalHeight * displayScale}px`,
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
          left: `${currentCrop.x * displayScale}px`,
          top: `${currentCrop.y * displayScale}px`,
          width: `${currentCrop.w * displayScale}px`,
          height: `${currentCrop.h * displayScale}px`,
          pointerEvents: 'none',
        }}
      >
        {/* L-shaped Crop Corners */}
        <div
          onMouseDown={(e) => onDragStart(e, 'crop-tl')}
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
          onMouseDown={(e) => onDragStart(e, 'crop-tr')}
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
          onMouseDown={(e) => onDragStart(e, 'crop-bl')}
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
          onMouseDown={(e) => onDragStart(e, 'crop-br')}
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
          left: `${(currentCrop.x + currentCrop.w / 2) * displayScale}px`,
          top: `${(currentCrop.y + currentCrop.h) * displayScale + 16}px`,
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
          onClick={onDone}
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
