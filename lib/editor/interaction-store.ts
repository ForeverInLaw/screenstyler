import { create } from 'zustand';
import type { Rect, ScreenshotItem } from '@/lib/document/schema';
import type { AlignmentGuide } from './screenshot-alignment';

interface InteractionState {
  previewItems: Record<string, ScreenshotItem>;
  marquee: Rect | null;
  guides: AlignmentGuide[];
  setPreviewItems: (items: readonly ScreenshotItem[], guides?: AlignmentGuide[]) => void;
  clearPreview: () => void;
  setMarquee: (marquee: Rect | null) => void;
}

/** Transient screenshot layouts; document history changes only on release. */
export const useInteractionStore = create<InteractionState>((set) => ({
  previewItems: {},
  marquee: null,
  guides: [],
  setPreviewItems: (items, guides = []) => set({ previewItems: Object.fromEntries(items.map((item) => [item.id, item])), guides }),
  clearPreview: () => set({ previewItems: {}, guides: [] }),
  setMarquee: (marquee) => set({ marquee }),
}));
