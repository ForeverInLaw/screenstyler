import type { CSSProperties } from 'react';
import type { BlurVariant } from '@/lib/document/schema';

export const blurVariants: { id: BlurVariant; label: string }[] = [
  { id: 'soft', label: 'Soft blur' },
  { id: 'frosted', label: 'Frosted blur' },
  { id: 'dim', label: 'Dim blur' },
];

export function getBlurVariant(variant?: BlurVariant): BlurVariant {
  return variant ?? 'soft';
}

export function blurOverlayStyle(variant: BlurVariant | undefined, intensity: number): CSSProperties {
  switch (getBlurVariant(variant)) {
    case 'frosted':
      return {
        backdropFilter: `blur(${intensity}px) saturate(1.6)`,
        backgroundColor: 'rgba(255,255,255,0.14)',
        border: '1px solid rgba(255,255,255,0.16)',
      };
    case 'dim':
      return {
        backdropFilter: `blur(${intensity}px) brightness(0.72)`,
        backgroundColor: 'rgba(0,0,0,0.18)',
      };
    case 'soft':
      return {
        backdropFilter: `blur(${intensity}px)`,
        backgroundColor: 'rgba(255,255,255,0.05)',
      };
  }
}

export function blurPreviewFill(variant?: BlurVariant) {
  return getBlurVariant(variant) === 'dim' ? 'rgba(0,0,0,0.26)' : 'rgba(255,255,255,0.26)';
}

