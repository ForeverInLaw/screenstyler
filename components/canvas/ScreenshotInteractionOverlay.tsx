'use client';
import { useInteractionStore } from '@/lib/editor/interaction-store';
import { screenshotRectStyle } from '@/lib/editor/screenshot-geometry';

type Props = { canvasWidth: number; canvasHeight: number };

export function ScreenshotInteractionOverlay({ canvasWidth, canvasHeight }: Props) {
  const marquee = useInteractionStore((state) => state.marquee);
  if (!marquee) return null;
  return (
    <div
      data-testid="selection-marquee"
      style={{ ...screenshotRectStyle(marquee, canvasWidth, canvasHeight), border: '1px solid #818cf8', background: 'rgba(99,102,241,0.12)', boxSizing: 'border-box' }}
    />
  );
}
