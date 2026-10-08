'use client';
import type { MouseEvent } from 'react';
import type { ScreenstylerDoc } from '@/lib/document/schema';
import type { ScreenshotTransform } from '@/lib/editor/screenshot-drag';
import { resizeSelectionWithKeyboard } from '@/lib/editor/screenshot-resize';

type Props = {
  content: ScreenstylerDoc['content'];
  onDragStart?: (event: MouseEvent, type: ScreenshotTransform) => void;
};

const corners = [
  { type: 'resize-tl', label: 'top-left', position: { left: -6, top: -6 }, cursor: 'nwse-resize' },
  { type: 'resize-tr', label: 'top-right', position: { right: -6, top: -6 }, cursor: 'nesw-resize' },
  { type: 'resize-bl', label: 'bottom-left', position: { left: -6, bottom: -6 }, cursor: 'nesw-resize' },
  { type: 'resize-br', label: 'bottom-right', position: { right: -6, bottom: -6 }, cursor: 'nwse-resize' },
] as const;

/** Editor-only selection border with optional corner resize handles. */
export function ScreenshotSelectionOverlay({ content, onDragStart }: Props) {
  return (
    <>
      <div
        className="hide-on-export"
        style={{
          position: 'absolute',
          inset: -2,
          border: '2px solid var(--studio-accent)',
          borderRadius: content.frame.type === 'none' ? `${content.cornerRadius + 2}px` : '14px',
          pointerEvents: 'none',
        }}
      />
      {onDragStart &&
        corners.map((corner) => (
          <button
            type="button"
            key={corner.type}
            className="hide-on-export"
            aria-label={`Resize from ${corner.label} corner`}
            title="Resize with arrow keys. Hold Shift for 10-pixel steps."
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => resizeSelectionWithKeyboard(event.nativeEvent, corner.type)}
            onMouseDown={(event) => onDragStart(event, corner.type)}
            style={{
              position: 'absolute',
              ...corner.position,
              width: 12,
              height: 12,
              padding: 0,
              background: 'var(--chalk)',
              border: '2px solid var(--studio-accent)',
              borderRadius: '50%',
              cursor: corner.cursor,
              pointerEvents: 'auto',
            }}
          />
        ))}
    </>
  );
}
