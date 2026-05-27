'use client';
import { type ReactNode } from 'react';
import type { ScreenstylerDoc, ScreenshotItem } from '@/lib/document/schema';
import { ScreenshotItemComponent } from './ScreenshotItemComponent';

type Props = {
  content: ScreenstylerDoc['content'];
  canvasWidth?: number;
  canvasHeight?: number;
  isPreview?: boolean;
  children?: ReactNode;
};

export function ContentLayer({ content, canvasWidth = 1600, canvasHeight = 1000, isPreview = false, children }: Props) {
  const { rotateX, rotateY, rotateZ, perspective, scale } = content.transform3d;
  const has3d = rotateX !== 0 || rotateY !== 0 || rotateZ !== 0;

  // Normalize screenshots on the fly if not present (e.g. raw unit test content object)
  let screenshots: ScreenshotItem[] = content.screenshots || [];
  if (screenshots.length === 0 && content.image) {
    const img = content.image;
    const w = img.naturalWidth || 800;
    const h = img.naturalHeight || 600;
    const pad = content.padding ?? 64;
    const contentW = Math.max(200, canvasWidth - 2 * pad);
    const contentH = Math.max(200, canvasHeight - 2 * pad);
    let targetW = w;
    let targetH = h;
    const aspect = w / h;
    if (w > contentW || h > contentH) {
      if (contentW / aspect <= contentH) {
        targetW = contentW;
        targetH = contentW / aspect;
      } else {
        targetH = contentH;
        targetW = contentH * aspect;
      }
    }
    const x = Math.max(0, Math.round((canvasWidth - targetW) / 2));
    const y = Math.max(0, Math.round((canvasHeight - targetH) / 2));
    
    screenshots = [{
      id: img.id || 'legacy-screenshot',
      image: img,
      x,
      y,
      width: Math.round(targetW),
      height: Math.round(targetH),
      scale: 1,
      crop: null,
    }];
  }

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
        zIndex: 2,
        pointerEvents: 'none',
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
            width: '100%',
            height: '100%',
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
            transition: 'transform 0.3s ease-out',
            willChange: has3d ? 'transform' : undefined,
          }}
        >
          {screenshots.map((item) => (
            <ScreenshotItemComponent
              key={item.id}
              item={item}
              content={content}
              isPreview={isPreview}
            />
          ))}
          {children}
        </div>
      </div>
    </div>
  );
}
