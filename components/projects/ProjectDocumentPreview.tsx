'use client';
import { useEffect, useRef, useState } from 'react';
import type { ScreenstylerDoc } from '@/lib/document/schema';
import { DocumentCanvas } from '@/components/canvas/DocumentCanvas';

/** Scale the editor renderer so frames, crops and annotations stay identical. */
export function ProjectDocumentPreview({ doc }: { doc: ScreenstylerDoc }) {
  const container = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const { width, height } = doc.canvas;

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const measure = () => setScale(Math.min(element.clientWidth / width, element.clientHeight / height));
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [width, height]);

  return (
    <div ref={container} className="relative size-full overflow-hidden" aria-hidden="true" style={{ pointerEvents: 'none' }}>
      <div inert style={{
        position: 'absolute', left: '50%', top: '50%', width, height,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}>
        <DocumentCanvas doc={doc} isPreview />
      </div>
    </div>
  );
}
