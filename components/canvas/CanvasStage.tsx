'use client';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useEditorUiStore } from '@/lib/editor/ui-store';

type Props = { docWidth: number; docHeight: number; children: ReactNode };

export function CanvasStage({ docWidth, docHeight, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const viewportZoom = useEditorUiStore((s) => s.viewportZoom);
  const setViewportZoom = useEditorUiStore((s) => s.setViewportZoom);
  const resetViewportZoom = useEditorUiStore((s) => s.resetViewportZoom);

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
      setFitScale(fit > 0 ? fit : 1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [docWidth, docHeight]);

  // Handle Alt+Wheel for viewport zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!e.altKey) return;
      e.preventDefault();

      const direction = e.deltaY < 0 ? 1 : -1;
      const step = e.shiftKey ? 0.15 : 0.08;
      const current = useEditorUiStore.getState().viewportZoom;
      const next = Number((current + direction * step).toFixed(2));
      setViewportZoom(next);
    },
    [setViewportZoom],
  );

  // Attach as non-passive so we can preventDefault on Alt+Wheel
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Reset zoom on double-click while holding Alt
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.altKey) {
        e.preventDefault();
        resetViewportZoom();
      }
    },
    [resetViewportZoom],
  );

  const combinedScale = fitScale * viewportZoom;
  const showZoomBadge = Math.abs(viewportZoom - 1) > 0.01;

  return (
    <div
      ref={containerRef}
      data-testid="canvas-stage"
      onDoubleClick={handleDoubleClick}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#0f1115',
        position: 'relative',
      }}
    >
      <div style={{ transform: `scale(${combinedScale})`, transformOrigin: 'center', transition: 'transform 0.1s ease-out' }}>
        {children}
      </div>

      {/* Zoom level indicator */}
      {showZoomBadge && (
        <div
          className="hide-on-export"
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            color: '#e2e8f0',
            fontSize: '12px',
            fontWeight: 500,
            fontFamily: 'Inter, system-ui, sans-serif',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.08)',
            userSelect: 'none',
            pointerEvents: 'none',
            zIndex: 50,
          }}
        >
          {Math.round(viewportZoom * 100)}%
        </div>
      )}
    </div>
  );
}
