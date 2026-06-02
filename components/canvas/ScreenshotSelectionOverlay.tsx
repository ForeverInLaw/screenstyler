'use client';
import React from 'react';
import { IconCrop, IconTrash, IconChevronUp, IconChevronDown } from '@tabler/icons-react';
import type { ScreenstylerDoc } from '@/lib/document/schema';
import type { ScreenshotDragType } from './ScreenshotItemComponent';

type Props = {
  content: ScreenstylerDoc['content'];
  onDragStart: (e: React.MouseEvent, type: ScreenshotDragType) => void;
  onCrop: () => void;
  onReorderFront: () => void;
  onReorderBack: () => void;
  onDelete: () => void;
};

/**
 * Selection chrome for a screenshot: indigo border, four corner resize handles,
 * and the floating action toolbar (crop / reorder / delete). Everything here is
 * editor-only and excluded from exports via `hide-on-export`.
 */
export function ScreenshotSelectionOverlay({
  content,
  onDragStart,
  onCrop,
  onReorderFront,
  onReorderBack,
  onDelete,
}: Props) {
  return (
    <>
      {/* Border highlight */}
      <div
        className="hide-on-export"
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
        className="hide-on-export"
        onMouseDown={(e) => onDragStart(e, 'resize-tl')}
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
        className="hide-on-export"
        onMouseDown={(e) => onDragStart(e, 'resize-tr')}
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
        className="hide-on-export"
        onMouseDown={(e) => onDragStart(e, 'resize-bl')}
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
        className="hide-on-export"
        onMouseDown={(e) => onDragStart(e, 'resize-br')}
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
          onClick={onCrop}
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
          onClick={onReorderFront}
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
          onClick={onReorderBack}
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
          onClick={onDelete}
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
  );
}
