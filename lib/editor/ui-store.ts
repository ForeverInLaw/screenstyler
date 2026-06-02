import { create } from 'zustand';
import { useDocumentStore, type CropAnchor } from '@/lib/document/store';

const MIN_VIEWPORT_ZOOM = 0.1;
const MAX_VIEWPORT_ZOOM = 5;

/** The active crop session: which screenshot, plus its entry anchor geometry. */
export type CropSession = CropAnchor & { itemId: string };

interface EditorUiState {
  selectedScreenshotId: string | null;
  selectedAnnotationId: string | null;
  isCropMode: boolean;
  cropSession: CropSession | null;
  viewportZoom: number;
  viewportOffset: { x: number; y: number };
  setSelectedScreenshotId: (id: string | null) => void;
  setSelectedAnnotationId: (id: string | null) => void;
  beginCrop: (itemId: string, anchor: CropAnchor) => void;
  endCrop: () => void;
  setIsCropMode: (mode: boolean) => void;
  setViewportZoom: (zoom: number) => void;
  setViewportOffset: (offset: { x: number; y: number }) => void;
  resetViewportZoom: () => void;
}

export const useEditorUiStore = create<EditorUiState>((set, get) => ({
  selectedScreenshotId: null,
  selectedAnnotationId: null,
  isCropMode: false,
  cropSession: null,
  viewportZoom: 1,
  viewportOffset: { x: 0, y: 0 },
  // Flush a pending crop back onto the item's box, then clear it. Centralised
  // here so every exit path (Done, deselect, selecting another item) commits.
  endCrop: () => {
    const { cropSession } = get();
    if (cropSession) {
      useDocumentStore.getState().commitCrop(cropSession.itemId, cropSession);
    }
    set({ isCropMode: false, cropSession: null });
  },
  setSelectedScreenshotId: (id) => {
    get().endCrop();
    set({ selectedScreenshotId: id, selectedAnnotationId: null });
  },
  setSelectedAnnotationId: (id) => {
    get().endCrop();
    set({ selectedAnnotationId: id, selectedScreenshotId: null });
  },
  beginCrop: (itemId, anchor) =>
    set({ isCropMode: true, cropSession: { itemId, ...anchor }, selectedScreenshotId: itemId, selectedAnnotationId: null }),
  setIsCropMode: (mode) => {
    if (mode) set({ isCropMode: true });
    else get().endCrop();
  },
  setViewportZoom: (zoom) => set({ viewportZoom: Math.min(MAX_VIEWPORT_ZOOM, Math.max(MIN_VIEWPORT_ZOOM, zoom)) }),
  setViewportOffset: (offset) => set({ viewportOffset: offset }),
  resetViewportZoom: () => set({ viewportZoom: 1, viewportOffset: { x: 0, y: 0 } }),
}));

