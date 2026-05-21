'use client';
import { forwardRef } from 'react';
import type { ScreenstylerDoc } from '@/lib/document/schema';
import { DocumentFrame } from './DocumentFrame';
import { BackgroundLayer } from './BackgroundLayer';
import { ContentLayer } from './ContentLayer';
import { AnnotationsLayer } from './AnnotationsLayer';
import { useDocumentStore } from '@/lib/document/store';

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

  return (
    <DocumentFrame ref={ref} width={doc.canvas.width} height={doc.canvas.height}>
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
