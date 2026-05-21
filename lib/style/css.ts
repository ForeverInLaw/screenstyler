import type { CSSProperties } from 'react';
import type { Background, Shadow } from '../document/schema';

export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function backgroundToCss(bg: Background, imageUrl?: string): string {
  switch (bg.type) {
    case 'solid':
      return bg.color;
    case 'gradient': {
      const stops = bg.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(', ');
      return `linear-gradient(${bg.angle}deg, ${stops})`;
    }
    case 'image':
      return imageUrl ? `url(${imageUrl})` : '#000000';
  }
}

export function backgroundToStyle(bg: Background, imageUrl?: string): CSSProperties {
  switch (bg.type) {
    case 'solid':
      return { backgroundColor: bg.color };
    case 'gradient': {
      const stops = bg.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(', ');
      return { backgroundImage: `linear-gradient(${bg.angle}deg, ${stops})` };
    }
    case 'image':
      return {
        backgroundColor: '#000000',
        backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
        backgroundSize: bg.fit,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
  }
}

export function shadowToCss(s: Shadow): string {
  return `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${withAlpha(s.color, s.opacity)}`;
}
