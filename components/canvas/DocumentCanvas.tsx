'use client';
import { forwardRef, type WheelEvent } from 'react';
import type { ScreenstylerDoc } from '@/lib/document/schema';
import { DocumentFrame } from './DocumentFrame';
import { BackgroundLayer } from './BackgroundLayer';
import { ContentLayer } from './ContentLayer';
import { AnnotationsLayer } from './AnnotationsLayer';
import { useDocumentStore } from '@/lib/document/store';

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
    isPreview?: boolean;
  }
>(function DocumentCanvas({ doc, activeTool = 'select', isPreview = false }, ref) {
  const annotations = useDocumentStore((s) => s.doc.annotations);
  const addAnnotation = useDocumentStore((s) => s.addAnnotation);
  const removeAnnotation = useDocumentStore((s) => s.removeAnnotation);
  const setTransform3d = useDocumentStore((s) => s.setTransform3d);

  function handleWheelZoom(event: WheelEvent<HTMLDivElement>) {
    if (isPreview || !doc.content.image) return;

    event.preventDefault();
    const transform3d = useDocumentStore.getState().doc.content.transform3d;
    const direction = event.deltaY < 0 ? 1 : -1;
    const step = event.shiftKey ? 0.1 : 0.05;
    const nextScale = clampContentScale(Number((transform3d.scale + direction * step).toFixed(2)));
    setTransform3d({ ...transform3d, scale: nextScale });
  }

  return (
    <DocumentFrame ref={ref} width={doc.canvas.width} height={doc.canvas.height} onWheel={handleWheelZoom}>
      <BackgroundLayer background={doc.canvas.background} />
      <ContentLayer content={doc.content} />
      <AnnotationsLayer
        annotations={annotations}
        activeTool={activeTool}
        canvasWidth={doc.canvas.width}
        canvasHeight={doc.canvas.height}
        onAddAnnotation={addAnnotation}
        onRemoveAnnotation={removeAnnotation}
        isPreview={isPreview}
      />
    </DocumentFrame>
  );
});
