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
  { id: 'slate', label: 'Slate', background: { type: 'solid', color: '#1e293b' } },
  { id: 'paper', label: 'Paper', background: { type: 'solid', color: '#f1f5f9' } },
];
