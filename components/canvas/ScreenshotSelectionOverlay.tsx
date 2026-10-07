'use client';
import React from 'react';
import type { ScreenstylerDoc } from '@/lib/document/schema';
import type { ScreenshotTransform } from '@/lib/editor/screenshot-drag';

type Props = {
  content: ScreenstylerDoc['content'];
  onDragStart?: (e: React.MouseEvent, type: ScreenshotTransform) => void;
};

/**
 * Selection bounds for a screenshot: indigo border and four resize handles.
 * Editor-only and excluded from exports via `hide-on-export`.
 */
export function ScreenshotSelectionOverlay({
  content,
  onDragStart,
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
      {onDragStart && <>
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
          pointerEvents: 'auto',
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
          pointerEvents: 'auto',
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
          pointerEvents: 'auto',
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
          pointerEvents: 'auto',
        }}
      />
      </>}
    </>
  );
}
