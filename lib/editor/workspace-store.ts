import { create } from 'zustand';

export type EditorTool = 'select' | 'arrow' | 'text' | 'highlight' | 'blur';

interface WorkspaceState {
  activeTool: EditorTool;
  isPreview: boolean;
  isInspectorOpen: boolean;
  setActiveTool: (activeTool: EditorTool) => void;
  togglePreview: () => void;
  toggleInspector: () => void;
  resetTools: () => void;
}

/** Navigation and visibility only; document data and geometry live elsewhere. */
export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeTool: 'select',
  isPreview: false,
  isInspectorOpen: true,
  resetTools: () => set({ activeTool: 'select', isPreview: false }),
  setActiveTool: (activeTool) => set({ activeTool }),
  togglePreview: () => set((state) => ({ isPreview: !state.isPreview })),
  toggleInspector: () => set((state) => ({ isInspectorOpen: !state.isInspectorOpen })),
}));
