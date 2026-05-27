'use client';
import { forwardRef, type WheelEvent } from 'react';
import type { ScreenstylerDoc } from '@/lib/document/schema';
import { DocumentFrame } from './DocumentFrame';
import { BackgroundLayer } from './BackgroundLayer';
import { ContentLayer } from './ContentLayer';
import { AnnotationsLayer } from './AnnotationsLayer';
import { useDocumentStore, normalizeDoc } from '@/lib/document/store';

import { useEditorUiStore } from '@/lib/editor/ui-store';

const MIN_CONTENT_SCALE = 0.5;
const MAX_CONTENT_SCALE = 2;

function clampContentScale(scale: number) {
  return Math.min(MAX_CONTENT_SCALE, Math.max(MIN_CONTENT_SCALE, scale));
}

export const DocumentCanvas = forwardRef<
  HTMLDivElement,
  {
    doc: ScreenstylerDoc;
    activeTool?: 'select' | 'arrow' | 'text' | 'highlight' | 'blur';
    onChangeTool?: (tool: 'select' | 'arrow' | 'text' | 'highlight' | 'blur') => void;
    isPreview?: boolean;
  }
>(function DocumentCanvas({ doc: rawDoc, activeTool = 'select', onChangeTool, isPreview = false }, ref) {
  const doc = normalizeDoc(rawDoc);
  const annotations = useDocumentStore((s) => s.doc.annotations);
  const addAnnotation = useDocumentStore((s) => s.addAnnotation);
  const removeAnnotation = useDocumentStore((s) => s.removeAnnotation);
  const setTransform3d = useDocumentStore((s) => s.setTransform3d);
  const setSelectedScreenshotId = useEditorUiStore((s) => s.setSelectedScreenshotId);

  const gridVisible = useDocumentStore((s) => s.doc.canvas.grid?.visible ?? false);
  const gridSize = useDocumentStore((s) => s.doc.canvas.grid?.size ?? 20);

  function handleWheelZoom(event: WheelEvent<HTMLDivElement>) {
    // Alt+Wheel is handled by CanvasStage for viewport zoom
    if (event.altKey) return;

    // If no screenshots, return
    const hasScreenshots = (doc.content.screenshots || []).length > 0;
    if (isPreview || !hasScreenshots) return;

    event.preventDefault();
    const transform3d = useDocumentStore.getState().doc.content.transform3d;
    const direction = event.deltaY < 0 ? 1 : -1;
    const step = event.shiftKey ? 0.1 : 0.05;
    const nextScale = clampContentScale(Number((transform3d.scale + direction * step).toFixed(2)));
    setTransform3d({ ...transform3d, scale: nextScale });
  }

  return (
    <DocumentFrame ref={ref} width={doc.canvas.width} height={doc.canvas.height} onWheel={handleWheelZoom}>
      <div
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        onClick={() => {
          if (!isPreview) {
            setSelectedScreenshotId(null);
          }
        }}
      >
        <BackgroundLayer background={doc.canvas.background} />
      </div>
      
      {!isPreview && gridVisible && (
        <div
          data-testid="grid-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 1,
            backgroundImage: 'radial-gradient(circle, rgba(128, 128, 128, 0.3) 1.5px, transparent 1.5px)',
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
        />
      )}

      <ContentLayer content={doc.content} canvasWidth={doc.canvas.width} canvasHeight={doc.canvas.height} isPreview={isPreview}>
        <AnnotationsLayer
          annotations={annotations}
          activeTool={activeTool}
          onChangeTool={onChangeTool}
          canvasWidth={doc.canvas.width}
          canvasHeight={doc.canvas.height}
          onAddAnnotation={addAnnotation}
          onRemoveAnnotation={removeAnnotation}
          isPreview={isPreview}
        />
      </ContentLayer>
    </DocumentFrame>
  );
});
