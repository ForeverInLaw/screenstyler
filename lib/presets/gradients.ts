import type { Background } from '../document/schema';

export type GradientPreset = { id: string; label: string; background: Background };

export const gradientPresets: GradientPreset[] = [
  { id: 'indigo', label: 'Indigo', background: { type: 'gradient', angle: 135,
    stops: [{ color: '#6366f1', offset: 0 }, { color: '#ec4899', offset: 1 }] } },
  { id: 'sunset', label: 'Sunset', background: { type: 'gradient', angle: 135,
    stops: [{ color: '#ff7e5f', offset: 0 }, { color: '#feb47b', offset: 1 }] } },
  { id: 'ocean', label: 'Ocean', background: { type: 'gradient', angle: 135,
    stops: [{ color: '#2193b0', offset: 0 }, { color: '#6dd5ed', offset: 1 }] } },
  { id: 'mint', label: 'Mint', background: { type: 'gradient', angle: 135,
    stops: [{ color: '#11998e', offset: 0 }, { color: '#38ef7d', offset: 1 }] } },
  { id: 'ember', label: 'Ember', background: { type: 'gradient', angle: 145,
    stops: [{ color: '#7f1d1d', offset: 0 }, { color: '#f97316', offset: 0.52 }, { color: '#fde68a', offset: 1 }] } },
  { id: 'aurora', label: 'Aurora', background: { type: 'gradient', angle: 120,
    stops: [{ color: '#0f172a', offset: 0 }, { color: '#14b8a6', offset: 0.5 }, { color: '#a78bfa', offset: 1 }] } },
  { id: 'candy', label: 'Candy', background: { type: 'gradient', angle: 115,
    stops: [{ color: '#f9a8d4', offset: 0 }, { color: '#c4b5fd', offset: 0.48 }, { color: '#93c5fd', offset: 1 }] } },
  { id: 'copper', label: 'Copper', background: { type: 'gradient', angle: 135,
    stops: [{ color: '#171717', offset: 0 }, { color: '#b45309', offset: 0.58 }, { color: '#fed7aa', offset: 1 }] } },
  { id: 'forest', label: 'Forest', background: { type: 'gradient', angle: 135,
    stops: [{ color: '#052e16', offset: 0 }, { color: '#16a34a', offset: 0.54 }, { color: '#bbf7d0', offset: 1 }] } },
  { id: 'mono', label: 'Mono', background: { type: 'gradient', angle: 135,
    stops: [{ color: '#111827', offset: 0 }, { color: '#6b7280', offset: 1 }] } },
  { id: 'slate', label: 'Slate', background: { type: 'solid', color: '#1e293b' } },
  { id: 'paper', label: 'Paper', background: { type: 'solid', color: '#f1f5f9' } },
];
