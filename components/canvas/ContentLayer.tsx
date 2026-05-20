'use client';
import type { ScreenstylerDoc } from '@/lib/document/schema';
import { Screenshot } from './Screenshot';
import { FrameMockup } from './FrameMockup';
import { AnnotationsLayer } from './AnnotationsLayer';
import { useDocumentStore } from '@/lib/document/store';

type Props = {
  content: ScreenstylerDoc['content'];
  canvasWidth: number;
  canvasHeight: number;
  activeTool?: 'select' | 'arrow' | 'text' | 'highlight' | 'blur';
};

export function ContentLayer({ content, canvasWidth, canvasHeight, activeTool = 'select' }: Props) {
  const annotations = useDocumentStore((s) => s.doc.annotations);
  const addAnnotation = useDocumentStore((s) => s.addAnnotation);
  const removeAnnotation = useDocumentStore((s) => s.removeAnnotation);

  const { rotateX, rotateY, rotateZ, perspective, scale } = content.transform3d;

  // Flatten the tilt when drawing annotations so mouse click coordinate mapping is 100% accurate
  const isEditingAnnotations = activeTool !== 'select';
  const rx = isEditingAnnotations ? 0 : rotateX;
  const ry = isEditingAnnotations ? 0 : rotateY;
  const rz = isEditingAnnotations ? 0 : rotateZ;
  const scl = isEditingAnnotations ? 1 : scale;

  const has3d = rx !== 0 || ry !== 0 || rz !== 0;

  return (
    <div
      data-testid="content-layer"
      style={{
        position: 'absolute',
        inset: 0,
        padding: `${content.padding}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      {/* 3D Perspective Container */}
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: has3d ? `${perspective}px` : undefined,
          transformStyle: has3d ? 'preserve-3d' : undefined,
        }}
      >
        {/* Tilting & scaling container */}
        <div
          style={{
            position: 'relative',
            transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scl})`,
            transformStyle: has3d ? 'preserve-3d' : undefined,
            transition: isDrawingOrEditing(activeTool) ? 'none' : 'transform 0.3s ease-out',
            willChange: has3d ? 'transform' : undefined,
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {content.image && (
            <FrameMockup
              frame={content.frame}
              shadow={content.shadow}
              cornerRadius={content.cornerRadius}
            >
              <Screenshot
                image={content.image}
                cornerRadius={content.frame.type === 'none' ? content.cornerRadius : 0}
                shadow={
                  content.frame.type === 'none'
                    ? content.shadow
                    : { x: 0, y: 0, blur: 0, spread: 0, color: '#000000', opacity: 0 }
                }
              />
            </FrameMockup>
          )}

          {/* Absolute overlay annotations layer */}
          <AnnotationsLayer
            annotations={annotations}
            activeTool={activeTool}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            onAddAnnotation={addAnnotation}
            onRemoveAnnotation={removeAnnotation}
          />
        </div>
      </div>
    </div>
  );
}

function isDrawingOrEditing(tool: string): boolean {
  return tool !== 'select';
}
