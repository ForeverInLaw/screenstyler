'use client';
import { forwardRef } from 'react';
import type { ScreenstylerDoc } from '@/lib/document/schema';
import { DocumentFrame } from './DocumentFrame';
import { BackgroundLayer } from './BackgroundLayer';
import { ContentLayer } from './ContentLayer';

export const DocumentCanvas = forwardRef<HTMLDivElement, { doc: ScreenstylerDoc }>(
  function DocumentCanvas({ doc }, ref) {
    return (
      <DocumentFrame ref={ref} width={doc.canvas.width} height={doc.canvas.height}>
        <BackgroundLayer background={doc.canvas.background} />
        <ContentLayer content={doc.content} />
      </DocumentFrame>
    );
  },
);
