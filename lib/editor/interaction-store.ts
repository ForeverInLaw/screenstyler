import { create } from 'zustand';
import type { Rect, ScreenshotItem } from '@/lib/document/schema';

interface InteractionState {
  previewItems: Record<string, ScreenshotItem>;
  marquee: Rect | null;
  setPreviewItems: (items: readonly ScreenshotItem[]) => void;
  clearPreview: () => void;
  setMarquee: (marquee: Rect | null) => void;
}

/** Transient screenshot layouts; document history changes only on release. */
export const useInteractionStore = create<InteractionState>((set) => ({
  previewItems: {},
  marquee: null,
  setPreviewItems: (items) => set({ previewItems: Object.fromEntries(items.map((item) => [item.id, item])) }),
  clearPreview: () => set({ previewItems: {} }),
  setMarquee: (marquee) => set({ marquee }),
}));
