'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';

type Props = { docWidth: number; docHeight: number; children: ReactNode };

export function CanvasStage({ docWidth, docHeight, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      const pad = 48;
      const fit = Math.min(
        (el.clientWidth - pad) / docWidth,
        (el.clientHeight - pad) / docHeight,
        1,
      );
      setScale(fit > 0 ? fit : 1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [docWidth, docHeight]);

  return (
    <div
      ref={containerRef}
      data-testid="canvas-stage"
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#0f1115',
      }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
        {children}
      </div>
    </div>
  );
}
