'use client';
import { useInteractionStore } from '@/lib/editor/interaction-store';
import { screenshotRectStyle } from '@/lib/editor/screenshot-geometry';

type Props = { canvasWidth: number; canvasHeight: number };

export function ScreenshotInteractionOverlay({ canvasWidth, canvasHeight }: Props) {
  const marquee = useInteractionStore((state) => state.marquee);
  const guides = useInteractionStore((state) => state.guides);
  return (
    <>
      {marquee && (
        <div
          data-testid="selection-marquee"
          style={{
            ...screenshotRectStyle(marquee, canvasWidth, canvasHeight),
            border: '1px solid var(--studio-accent)',
            background: 'var(--studio-accent-soft)',
            boxSizing: 'border-box',
          }}
        />
      )}
      {guides.map((guide) => (
        <div
          key={guide.axis}
          data-testid="alignment-guide"
          style={{
            position: 'absolute',
            background: 'var(--studio-accent)',
            pointerEvents: 'none',
            left: `${((guide.axis === 'x' ? guide.position : guide.start) / canvasWidth) * 100}%`,
            top: `${((guide.axis === 'y' ? guide.position : guide.start) / canvasHeight) * 100}%`,
            width: guide.axis === 'x' ? 2 : `${((guide.end - guide.start) / canvasWidth) * 100}%`,
            height: guide.axis === 'y' ? 2 : `${((guide.end - guide.start) / canvasHeight) * 100}%`,
          }}
        />
      ))}
    </>
  );
}
