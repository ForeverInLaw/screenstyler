'use client';
import type { Background } from '@/lib/document/schema';
import { backgroundToCss } from '@/lib/style/css';
import { useObjectUrl } from './use-object-url';

export function BackgroundLayer({ background }: { background: Background }) {
  const imageUrl = useObjectUrl(background.type === 'image' ? background.ref.blobKey : null);
  const imageExtra =
    background.type === 'image'
      ? { backgroundSize: background.fit, backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
      : {};
  return (
    <div
      data-testid="background-layer"
      style={{
        position: 'absolute',
        inset: 0,
        background: backgroundToCss(background, imageUrl ?? undefined),
        ...imageExtra,
      }}
    />
  );
}
