import { create } from 'zustand';

interface EditorUiState {
  selectedScreenshotId: string | null;
  isCropMode: boolean;
  setSelectedScreenshotId: (id: string | null) => void;
  setIsCropMode: (mode: boolean) => void;
}

export const useEditorUiStore = create<EditorUiState>((set) => ({
  selectedScreenshotId: null,
  isCropMode: false,
  setSelectedScreenshotId: (id) => set({ selectedScreenshotId: id, isCropMode: false }), // Reset crop mode on selection change
  setIsCropMode: (mode) => set({ isCropMode: mode }),
}));
