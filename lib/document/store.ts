import { create } from 'zustand';
import { temporal } from 'zundo';
import type { Background, ImageRef, ScreenstylerDoc, Shadow } from './schema';
import { createBlankDoc } from './factory';

interface DocumentState {
  doc: ScreenstylerDoc;
  setBackground: (background: Background) => void;
  setPadding: (padding: number) => void;
  setCornerRadius: (cornerRadius: number) => void;
  setShadow: (shadow: Shadow) => void;
  setImage: (image: ImageRef) => void;
  setCanvasSize: (preset: string, width: number, height: number) => void;
  loadDoc: (doc: ScreenstylerDoc) => void;
}

export const useDocumentStore = create<DocumentState>()(
  temporal(
    (set) => ({
      doc: createBlankDoc(),
      setBackground: (background) =>
        set((s) => ({ doc: { ...s.doc, canvas: { ...s.doc.canvas, background } } })),
      setPadding: (padding) =>
        set((s) => ({ doc: { ...s.doc, content: { ...s.doc.content, padding } } })),
      setCornerRadius: (cornerRadius) =>
        set((s) => ({ doc: { ...s.doc, content: { ...s.doc.content, cornerRadius } } })),
      setShadow: (shadow) =>
        set((s) => ({ doc: { ...s.doc, content: { ...s.doc.content, shadow } } })),
      setImage: (image) =>
        set((s) => ({ doc: { ...s.doc, content: { ...s.doc.content, image } } })),
      setCanvasSize: (preset, width, height) =>
        set((s) => ({ doc: { ...s.doc, canvas: { ...s.doc.canvas, preset, width, height } } })),
      loadDoc: (doc) => set({ doc }),
    }),
    { limit: 100, partialize: (s) => ({ doc: s.doc }) },
  ),
);
