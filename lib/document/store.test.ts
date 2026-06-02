import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentStore } from './store';
import { createBlankDoc } from './factory';

beforeEach(() => {
  useDocumentStore.getState().loadDoc(createBlankDoc());
  useDocumentStore.temporal.getState().clear();
});

describe('useDocumentStore', () => {
  it('updates padding', () => {
    useDocumentStore.getState().setPadding(120);
    expect(useDocumentStore.getState().doc.content.padding).toBe(120);
  });

  it('updates the background', () => {
    useDocumentStore.getState().setBackground({ type: 'solid', color: '#000000' });
    expect(useDocumentStore.getState().doc.canvas.background).toEqual({
      type: 'solid', color: '#000000',
    });
  });

  it('undoes and redoes a mutation', () => {
    useDocumentStore.getState().setPadding(200);
    useDocumentStore.temporal.getState().undo();
    expect(useDocumentStore.getState().doc.content.padding).toBe(64);
    useDocumentStore.temporal.getState().redo();
    expect(useDocumentStore.getState().doc.content.padding).toBe(200);
  });

  it('updates 3D transform', () => {
    const t3d = { rotateX: 10, rotateY: -15, rotateZ: 5, perspective: 1000, scale: 0.9 };
    useDocumentStore.getState().setTransform3d(t3d);
    expect(useDocumentStore.getState().doc.content.transform3d).toEqual(t3d);
  });

  it('updates frame config', () => {
    const frame = { type: 'browser' as const, variant: 'safari' as const, url: 'abc.com', theme: 'dark' as const };
    useDocumentStore.getState().setFrame(frame);
    expect(useDocumentStore.getState().doc.content.frame).toEqual(frame);
  });

  it('manages annotations', () => {
    const annotation = { id: 'a1', type: 'arrow' as const, from: { x: 0, y: 0 }, to: { x: 10, y: 10 }, color: '#ff0000', thickness: 2 };
    useDocumentStore.getState().addAnnotation(annotation);
    expect(useDocumentStore.getState().doc.annotations).toEqual([annotation]);

    useDocumentStore.getState().removeAnnotation('a1');
    expect(useDocumentStore.getState().doc.annotations).toEqual([]);
  });

  it('commitCrop maps the crop rectangle back onto the item box', () => {
    const doc = createBlankDoc();
    doc.content.screenshots = [
      {
        id: 's1',
        image: { id: 'i1', blobKey: 'b1', naturalWidth: 800, naturalHeight: 600 },
        x: 100,
        y: 50,
        width: 400,
        height: 300,
        scale: 1,
        crop: { x: 200, y: 150, w: 400, h: 300 },
      },
    ];
    useDocumentStore.getState().loadDoc(doc);

    // Anchor as captured on crop entry: scale = width/naturalWidth = 0.5,
    // imageX/Y = the full image's on-canvas origin (item.x/y, crop was null).
    useDocumentStore.getState().commitCrop('s1', { scale: 0.5, imageX: 100, imageY: 50 });

    const item = useDocumentStore.getState().doc.content.screenshots[0];
    expect({ x: item.x, y: item.y, width: item.width, height: item.height }).toEqual({
      x: 200, // 100 + 200*0.5
      y: 125, // 50 + 150*0.5
      width: 200, // 400*0.5
      height: 150, // 300*0.5
    });
    // The crop itself is preserved — only the bounding box is remapped.
    expect(item.crop).toEqual({ x: 200, y: 150, w: 400, h: 300 });
  });

  it('commitCrop is a no-op for an unknown id', () => {
    const before = useDocumentStore.getState().doc;
    useDocumentStore.getState().commitCrop('nope', { scale: 1, imageX: 0, imageY: 0 });
    expect(useDocumentStore.getState().doc).toBe(before);
  });

  it('applies style preset as a single undo step', () => {
    const preset = {
      padding: 100,
      cornerRadius: 20,
      shadow: { x: 5, y: 5, blur: 10, spread: 0, color: '#000000', opacity: 0.5 },
      frame: { type: 'window' as const, variant: 'macos' as const },
      transform3d: { rotateX: 10, rotateY: 10, rotateZ: 0, perspective: 1200, scale: 0.95 },
    };

    useDocumentStore.getState().applyStylePreset(preset);

    const doc = useDocumentStore.getState().doc;
    expect(doc.content.padding).toBe(100);
    expect(doc.content.cornerRadius).toBe(20);
    expect(doc.content.frame).toEqual({ type: 'window', variant: 'macos' });

    // Verify it is a single undo step
    useDocumentStore.temporal.getState().undo();
    const docAfterUndo = useDocumentStore.getState().doc;
    expect(docAfterUndo.content.padding).toBe(64); // back to initial
    expect(docAfterUndo.content.cornerRadius).toBe(12);
    expect(docAfterUndo.content.frame).toEqual({ type: 'none' });
  });
});

