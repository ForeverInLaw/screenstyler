import { create } from 'zustand';
import { temporal } from 'zundo';
import type { Background, ImageRef, ScreenstylerDoc, Shadow, Frame, Transform3D, Annotation, ScreenshotItem } from './schema';
import { createBlankDoc } from './factory';

export function normalizeDoc(rawDoc: unknown): ScreenstylerDoc {
  if (!rawDoc || typeof rawDoc !== 'object') return createBlankDoc();
  // Treat the clone as a fully-shaped doc and backfill any missing pieces below;
  // every access is guarded before use, so the optimistic type is safe.
  const doc = structuredClone(rawDoc) as ScreenstylerDoc;
  if (!doc.version) doc.version = 1;
  if (!doc.canvas) {
    doc.canvas = { preset: 'free', width: 1600, height: 1000, background: { type: 'solid', color: '#0f1115' } };
  }
  if (!doc.canvas.grid) {
    doc.canvas.grid = { visible: false, size: 20, snap: false };
  }
  if (!doc.content) {
    doc.content = {
      image: null,
      padding: 64,
      cornerRadius: 12,
      shadow: { x: 0, y: 30, blur: 60, spread: 0, color: '#000000', opacity: 0.35 },
      frame: { type: 'none' },
      transform3d: { rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 1500, scale: 1 },
    };
  }
  if (!doc.content.screenshots || doc.content.screenshots.length === 0) {
    doc.content.screenshots = [];
    if (doc.content.image) {
      const img = doc.content.image;
      const naturalW = img.naturalWidth || 800;
      const naturalH = img.naturalHeight || 600;
      const pad = doc.content.padding ?? 64;
      const canvasW = doc.canvas.width || 1600;
      const canvasH = doc.canvas.height || 1000;
      const contentW = Math.max(200, canvasW - 2 * pad);
      const contentH = Math.max(200, canvasH - 2 * pad);
      let w = naturalW;
      let h = naturalH;
      const aspect = w / h;
      if (w > contentW || h > contentH) {
        if (contentW / aspect <= contentH) {
          w = contentW;
          h = contentW / aspect;
        } else {
          h = contentH;
          w = contentH * aspect;
        }
      }
      const x = Math.max(0, Math.round((canvasW - w) / 2));
      const y = Math.max(0, Math.round((canvasH - h) / 2));
      doc.content.screenshots.push({
        id: img.id || crypto.randomUUID(),
        image: img,
        x,
        y,
        width: Math.round(w),
        height: Math.round(h),
        scale: 1,
        crop: null,
      });
    }
  }
  if (!doc.annotations) {
    doc.annotations = [];
  }
  return doc as ScreenstylerDoc;
}

interface DocumentState {
  doc: ScreenstylerDoc;
  setBackground: (background: Background) => void;
  setPadding: (padding: number) => void;
  setCornerRadius: (cornerRadius: number) => void;
  setShadow: (shadow: Shadow) => void;
  setImage: (image: ImageRef) => void;
  addScreenshot: (image: ImageRef, x?: number, y?: number) => void;
  removeScreenshot: (id: string) => void;
  updateScreenshot: (id: string, updates: Partial<Omit<ScreenshotItem, 'id' | 'image'>>) => void;
  reorderScreenshot: (id: string, direction: 'front' | 'back') => void;
  setGridSettings: (grid: Partial<{ visible: boolean; size: number; snap: boolean }>) => void;
  setCanvasSize: (preset: string, width: number, height: number) => void;
  setTransform3d: (transform3d: Transform3D) => void;
  setFrame: (frame: Frame) => void;
  setAnnotations: (annotations: Annotation[]) => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
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
        set((s) => {
          const canvasW = s.doc.canvas.width;
          const canvasH = s.doc.canvas.height;
          const newScreenshot: ScreenshotItem = {
            id: image.id || crypto.randomUUID(),
            image,
            x: Math.max(0, Math.round((canvasW - image.naturalWidth) / 2)),
            y: Math.max(0, Math.round((canvasH - image.naturalHeight) / 2)),
            width: image.naturalWidth,
            height: image.naturalHeight,
            scale: 1,
            crop: null,
          };
          return {
            doc: {
              ...s.doc,
              content: {
                ...s.doc.content,
                image,
                screenshots: [newScreenshot],
              },
            },
          };
        }),
      addScreenshot: (image, x, y) =>
        set((s) => {
          const canvasW = s.doc.canvas.width;
          const canvasH = s.doc.canvas.height;
          const imgW = image.naturalWidth;
          const imgH = image.naturalHeight;
          const targetW = Math.min(imgW, canvasW * 0.6);
          const targetH = (targetW / imgW) * imgH;
          const posX = x !== undefined ? x : Math.round((canvasW - targetW) / 2);
          const posY = y !== undefined ? y : Math.round((canvasH - targetH) / 2);
          const newScreenshot: ScreenshotItem = {
            id: crypto.randomUUID(),
            image,
            x: posX,
            y: posY,
            width: Math.round(targetW),
            height: Math.round(targetH),
            scale: 1,
            crop: null,
          };
          const screenshots = s.doc.content.screenshots || [];
          return {
            doc: {
              ...s.doc,
              content: {
                ...s.doc.content,
                screenshots: [...screenshots, newScreenshot],
              },
            },
          };
        }),
      removeScreenshot: (id) =>
        set((s) => ({
          doc: {
            ...s.doc,
            content: {
              ...s.doc.content,
              screenshots: (s.doc.content.screenshots || []).filter((item) => item.id !== id),
            },
          },
        })),
      updateScreenshot: (id, updates) =>
        set((s) => ({
          doc: {
            ...s.doc,
            content: {
              ...s.doc.content,
              screenshots: (s.doc.content.screenshots || []).map((item) =>
                item.id === id ? { ...item, ...updates } : item
              ),
            },
          },
        })),
      reorderScreenshot: (id, direction) =>
        set((s) => {
          const list = [...(s.doc.content.screenshots || [])];
          const idx = list.findIndex((item) => item.id === id);
          if (idx === -1) return {};
          const [item] = list.splice(idx, 1);
          if (direction === 'front') {
            list.push(item);
          } else {
            list.unshift(item);
          }
          return {
            doc: {
              ...s.doc,
              content: {
                ...s.doc.content,
                screenshots: list,
              },
            },
          };
        }),
      setGridSettings: (gridSettings) =>
        set((s) => ({
          doc: {
            ...s.doc,
            canvas: {
              ...s.doc.canvas,
              grid: {
                visible: s.doc.canvas.grid?.visible ?? false,
                size: s.doc.canvas.grid?.size ?? 20,
                snap: s.doc.canvas.grid?.snap ?? false,
                ...gridSettings,
              },
            },
          },
        })),
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
      updateAnnotation: (id, updates) =>
        set((s) => ({
          doc: {
            ...s.doc,
            annotations: s.doc.annotations.map((a) =>
              a.id === id ? ({ ...a, ...updates } as Annotation) : a
            ),
          },
        })),
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
      loadDoc: (doc) => set({ doc: normalizeDoc(doc) }),
    }),
    { limit: 100, partialize: (s) => ({ doc: s.doc }) },
  ),
);

