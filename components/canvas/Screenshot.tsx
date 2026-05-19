'use client';
import type { ImageRef, Shadow } from '@/lib/document/schema';
import { shadowToCss } from '@/lib/style/css';
import { useObjectUrl } from './use-object-url';

type Props = { image: ImageRef; cornerRadius: number; shadow: Shadow };

export function Screenshot({ image, cornerRadius, shadow }: Props) {
  const url = useObjectUrl(image.blobKey);
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      data-testid="screenshot"
      src={url}
      alt=""
      style={{
        display: 'block',
        maxWidth: '100%',
        height: 'auto',
        borderRadius: `${cornerRadius}px`,
        boxShadow: shadowToCss(shadow),
      }}
    />
  );
}
