import { create } from 'zustand';
import { temporal } from 'zundo';
import type { Background, ImageRef, ScreenstylerDoc, Shadow, Frame, Transform3D, Annotation } from './schema';
import { createBlankDoc } from './factory';

interface DocumentState {
  doc: ScreenstylerDoc;
  setBackground: (background: Background) => void;
  setPadding: (padding: number) => void;
  setCornerRadius: (cornerRadius: number) => void;
  setShadow: (shadow: Shadow) => void;
  setImage: (image: ImageRef) => void;
  setCanvasSize: (preset: string, width: number, height: number) => void;
  setTransform3d: (transform3d: Transform3D) => void;
  setFrame: (frame: Frame) => void;
  setAnnotations: (annotations: Annotation[]) => void;
  addAnnotation: (annotation: Annotation) => void;
  removeAnnotation: (id: string) => void;
  applyStylePreset: (styles: {
    padding: number;
    cornerRadius: number;
    shadow: Shadow;
    frame: Frame;
    transform3d: Transform3D;
  }) => void;
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
      setTransform3d: (transform3d) =>
        set((s) => ({ doc: { ...s.doc, content: { ...s.doc.content, transform3d } } })),
      setFrame: (frame) =>
        set((s) => ({ doc: { ...s.doc, content: { ...s.doc.content, frame } } })),
      setAnnotations: (annotations) =>
        set((s) => ({ doc: { ...s.doc, annotations } })),
      addAnnotation: (annotation) =>
        set((s) => ({ doc: { ...s.doc, annotations: [...s.doc.annotations, annotation] } })),
      removeAnnotation: (id) =>
        set((s) => ({
          doc: { ...s.doc, annotations: s.doc.annotations.filter((a) => a.id !== id) },
        })),
      applyStylePreset: (styles) =>
        set((s) => ({
          doc: {
            ...s.doc,
            content: {
              ...s.doc.content,
              padding: styles.padding,
              cornerRadius: styles.cornerRadius,
              shadow: styles.shadow,
              frame: styles.frame,
              transform3d: styles.transform3d,
            },
          },
        })),
      loadDoc: (doc) => set({ doc }),
    }),
    { limit: 100, partialize: (s) => ({ doc: s.doc }) },
  ),
);

