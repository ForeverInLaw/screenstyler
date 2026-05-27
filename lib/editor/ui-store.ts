import { create } from 'zustand';

const MIN_VIEWPORT_ZOOM = 0.1;
const MAX_VIEWPORT_ZOOM = 5;

interface EditorUiState {
  selectedScreenshotId: string | null;
  selectedAnnotationId: string | null;
  isCropMode: boolean;
  viewportZoom: number;
  setSelectedScreenshotId: (id: string | null) => void;
  setSelectedAnnotationId: (id: string | null) => void;
  setIsCropMode: (mode: boolean) => void;
  setViewportZoom: (zoom: number) => void;
  resetViewportZoom: () => void;
}

export const useEditorUiStore = create<EditorUiState>((set) => ({
  selectedScreenshotId: null,
  selectedAnnotationId: null,
  isCropMode: false,
  viewportZoom: 1,
  setSelectedScreenshotId: (id) => set({ selectedScreenshotId: id, selectedAnnotationId: null, isCropMode: false }),
  setSelectedAnnotationId: (id) => set({ selectedAnnotationId: id, selectedScreenshotId: null }),
  setIsCropMode: (mode) => set({ isCropMode: mode }),
  setViewportZoom: (zoom) => set({ viewportZoom: Math.min(MAX_VIEWPORT_ZOOM, Math.max(MIN_VIEWPORT_ZOOM, zoom)) }),
  resetViewportZoom: () => set({ viewportZoom: 1 }),
}));
