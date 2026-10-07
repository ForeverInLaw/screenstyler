import { create } from 'zustand';
import type { ScreenshotItem } from '@/lib/document/schema';

interface InteractionState {
  previewItems: Record<string, ScreenshotItem>;
  setPreviewItems: (items: readonly ScreenshotItem[]) => void;
  clearPreview: () => void;
}

/** Transient screenshot layouts; document history changes only on release. */
export const useInteractionStore = create<InteractionState>((set) => ({
  previewItems: {},
  setPreviewItems: (items) => set({ previewItems: Object.fromEntries(items.map((item) => [item.id, item])) }),
  clearPreview: () => set({ previewItems: {} }),
}));
