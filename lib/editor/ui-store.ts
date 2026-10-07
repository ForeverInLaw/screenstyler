import { create } from 'zustand';
import { useDocumentStore, type CropAnchor } from '@/lib/document/store';

const MIN_VIEWPORT_ZOOM = 0.1;
const MAX_VIEWPORT_ZOOM = 5;

/** The active crop session: which screenshot, plus its entry anchor geometry. */
export type CropSession = CropAnchor & { itemId: string };

interface EditorUiState {
  selectedScreenshotIds: string[];
  selectedAnnotationId: string | null;
  isCropMode: boolean;
  cropSession: CropSession | null;
  viewportZoom: number;
  viewportOffset: { x: number; y: number };
  setSelectedScreenshotId: (id: string | null) => void;
  setSelectedScreenshotIds: (ids: readonly string[]) => void;
  toggleScreenshot: (id: string) => void;
  setSelectedAnnotationId: (id: string | null) => void;
  beginCrop: (itemId: string, anchor: CropAnchor) => void;
  endCrop: () => void;
  setIsCropMode: (mode: boolean) => void;
  setViewportZoom: (zoom: number) => void;
  setViewportOffset: (offset: { x: number; y: number }) => void;
  resetViewportZoom: () => void;
}

export const useEditorUiStore = create<EditorUiState>((set, get) => ({
  selectedScreenshotIds: [],
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
    get().setSelectedScreenshotIds(id ? [id] : []);
  },
  setSelectedScreenshotIds: (ids) => {
    get().endCrop();
    const existing = new Set(useDocumentStore.getState().doc.content.screenshots?.map((item) => item.id));
    set({ selectedScreenshotIds: [...new Set(ids)].filter((id) => existing.has(id)), selectedAnnotationId: null });
  },
  toggleScreenshot: (id) => {
    const ids = get().selectedScreenshotIds;
    get().setSelectedScreenshotIds(ids.includes(id) ? ids.filter((selected) => selected !== id) : [...ids, id]);
  },
  setSelectedAnnotationId: (id) => {
    get().endCrop();
    set({ selectedAnnotationId: id, selectedScreenshotIds: [] });
  },
  beginCrop: (itemId, anchor) =>
    set({ isCropMode: true, cropSession: { itemId, ...anchor }, selectedScreenshotIds: [itemId], selectedAnnotationId: null }),
  setIsCropMode: (mode) => {
    if (mode) set({ isCropMode: true });
    else get().endCrop();
  },
  setViewportZoom: (zoom) => set({ viewportZoom: Math.min(MAX_VIEWPORT_ZOOM, Math.max(MIN_VIEWPORT_ZOOM, zoom)) }),
  setViewportOffset: (offset) => set({ viewportOffset: offset }),
  resetViewportZoom: () => set({ viewportZoom: 1, viewportOffset: { x: 0, y: 0 } }),
}));
