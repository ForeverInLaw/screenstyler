'use client';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useEditorUiStore } from '@/lib/editor/ui-store';

type Props = { docWidth: number; docHeight: number; children: ReactNode };

export function CanvasStage({ docWidth, docHeight, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const panCleanupRef = useRef<(() => void) | null>(null);
  const [fitScale, setFitScale] = useState(1);
  const viewportZoom = useEditorUiStore((s) => s.viewportZoom);
  const viewportOffset = useEditorUiStore((s) => s.viewportOffset);
  const resetViewportZoom = useEditorUiStore((s) => s.resetViewportZoom);

  // Auto-fit on resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      const pad = 48;
      const fit = Math.min((el.clientWidth - pad) / docWidth, (el.clientHeight - pad) / docHeight, 1);
      setFitScale(fit > 0 ? fit : 1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [docWidth, docHeight]);

  // Alt+Wheel: zoom towards cursor position
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!e.altKey || e.deltaY === 0) return;
    e.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    // Mouse position relative to the container center
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top - rect.height / 2;

    const state = useEditorUiStore.getState();
    const oldZoom = state.viewportZoom;
    const oldOffset = state.viewportOffset;

    const direction = e.deltaY < 0 ? 1 : -1;
    const step = e.shiftKey ? 0.15 : 0.08;
    const rawNext = oldZoom + direction * step;
    const newZoom = Math.min(5, Math.max(0.1, Number(rawNext.toFixed(2))));

    if (newZoom === oldZoom) return;

    const ratio = newZoom / oldZoom;

    // Zoom-to-cursor formula:
    // The point under the cursor should stay fixed.
    // newOffset = mouse - (mouse - oldOffset) * ratio
    const newOffsetX = mx - (mx - oldOffset.x) * ratio;
    const newOffsetY = my - (my - oldOffset.y) * ratio;

    useEditorUiStore.getState().setViewportZoom(newZoom);
    useEditorUiStore.getState().setViewportOffset({ x: newOffsetX, y: newOffsetY });
  }, []);

  // Attach as non-passive so we can preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Middle-mouse-button panning
  useEffect(() => () => panCleanupRef.current?.(), []);

  const handleMiddleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 1) return; // middle button only
    e.preventDefault();
    panCleanupRef.current?.();

    const startX = e.clientX;
    const startY = e.clientY;
    const startOffset = useEditorUiStore.getState().viewportOffset;

    const container = containerRef.current;
    if (container) container.style.cursor = 'grabbing';

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      useEditorUiStore.getState().setViewportOffset({
        x: startOffset.x + dx,
        y: startOffset.y + dy,
      });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('blur', onMouseUp);
      if (container) container.style.cursor = '';
      panCleanupRef.current = null;
    };

    panCleanupRef.current = onMouseUp;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('blur', onMouseUp);
  }, []);

  // Alt+Double-click to reset zoom
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

  return (
    <div
      ref={containerRef}
      data-testid="canvas-stage"
      onMouseDown={handleMiddleMouseDown}
      onDoubleClick={handleDoubleClick}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'var(--cutting-mat)',
        position: 'relative',
      }}
    >
      <div
        ref={innerRef}
        style={{
          transform: `translate(${viewportOffset.x}px, ${viewportOffset.y}px) scale(${combinedScale})`,
          transformOrigin: 'center',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
}
