'use client';
import type { MouseEvent } from 'react';
import type { ScreenstylerDoc } from '@/lib/document/schema';
import type { ScreenshotTransform } from '@/lib/editor/screenshot-drag';

type Props = {
  content: ScreenstylerDoc['content'];
  onDragStart?: (event: MouseEvent, type: ScreenshotTransform) => void;
};

const corners = [
  { type: 'resize-tl', position: { left: -6, top: -6 }, cursor: 'nwse-resize' },
  { type: 'resize-tr', position: { right: -6, top: -6 }, cursor: 'nesw-resize' },
  { type: 'resize-bl', position: { left: -6, bottom: -6 }, cursor: 'nesw-resize' },
  { type: 'resize-br', position: { right: -6, bottom: -6 }, cursor: 'nwse-resize' },
] as const;

/** Editor-only selection border with optional corner resize handles. */
export function ScreenshotSelectionOverlay({ content, onDragStart }: Props) {
  return (
    <>
      <div
        className="hide-on-export"
        style={{
          position: 'absolute', inset: -2, border: '2px solid #6366f1',
          borderRadius: content.frame.type === 'none' ? `${content.cornerRadius + 2}px` : '14px',
          pointerEvents: 'none',
        }}
      />
      {onDragStart && corners.map((corner) => (
        <div
          key={corner.type}
          className="hide-on-export"
          onMouseDown={(event) => onDragStart(event, corner.type)}
          style={{
            position: 'absolute', ...corner.position, width: 12, height: 12,
            background: '#ffffff', border: '2px solid #6366f1', borderRadius: '50%',
            cursor: corner.cursor, pointerEvents: 'auto',
          }}
        />
      ))}
    </>
  );
}
