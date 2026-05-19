'use client';
import type { ScreenstylerDoc } from '@/lib/document/schema';
import { Screenshot } from './Screenshot';

export function ContentLayer({ content }: { content: ScreenstylerDoc['content'] }) {
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
      {content.image && (
        <Screenshot
          image={content.image}
          cornerRadius={content.cornerRadius}
          shadow={content.shadow}
        />
      )}
    </div>
  );
}
