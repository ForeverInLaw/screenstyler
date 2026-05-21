'use client';
import type { Background } from '@/lib/document/schema';
import { backgroundToStyle } from '@/lib/style/css';
import { useObjectUrl } from './use-object-url';

export function BackgroundLayer({ background }: { background: Background }) {
  const imageUrl = useObjectUrl(background.type === 'image' ? background.ref.blobKey : null);
  return (
    <div
      data-testid="background-layer"
      style={{
        position: 'absolute',
        inset: 0,
        ...backgroundToStyle(background, imageUrl ?? undefined),
      }}
    />
  );
}
