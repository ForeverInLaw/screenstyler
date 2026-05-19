import { create } from 'zustand';

interface UiState {
  currentProjectId: string | null;
  isExporting: boolean;
  setCurrentProjectId: (id: string | null) => void;
  setIsExporting: (value: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  currentProjectId: null,
  isExporting: false,
  setCurrentProjectId: (currentProjectId) => set({ currentProjectId }),
  setIsExporting: (isExporting) => set({ isExporting }),
}));
