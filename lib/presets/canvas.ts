export type CanvasPreset = { id: string; label: string; width: number; height: number };

export const canvasPresets: CanvasPreset[] = [
  { id: 'free', label: 'Free', width: 1600, height: 1000 },
  { id: 'twitter', label: 'Twitter / X', width: 1600, height: 900 },
  { id: 'instagram-post', label: 'Instagram Post', width: 1080, height: 1080 },
  { id: 'og', label: 'OG Image', width: 1200, height: 630 },
  { id: '4k', label: '4K', width: 3840, height: 2160 },
];

export function getCanvasPreset(id: string): CanvasPreset | undefined {
  return canvasPresets.find((p) => p.id === id);
}
