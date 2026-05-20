'use client';
import type { ScreenstylerDoc } from '@/lib/document/schema';
import { Screenshot } from './Screenshot';
import { FrameMockup } from './FrameMockup';

type Props = {
  content: ScreenstylerDoc['content'];
};

export function ContentLayer({ content }: Props) {
  const { rotateX, rotateY, rotateZ, perspective, scale } = content.transform3d;
  const has3d = rotateX !== 0 || rotateY !== 0 || rotateZ !== 0;

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
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
            transformStyle: has3d ? 'preserve-3d' : undefined,
            transition: 'transform 0.3s ease-out',
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
        </div>
      </div>
    </div>
  );
}
