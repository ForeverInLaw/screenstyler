import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AnnotationsLayer } from './AnnotationsLayer';
import type { Annotation } from '@/lib/document/schema';
import { useAnnotationStyleStore } from '@/lib/editor/annotation-style-store';

beforeEach(() => {
  useAnnotationStyleStore.getState().reset();
});

describe('AnnotationsLayer', () => {
  it('uses configured arrow color and variant when drawing', () => {
    let added: Annotation | null = null;
    useAnnotationStyleStore.getState().setArrowColor('#22c55e');
    useAnnotationStyleStore.getState().setArrowVariant('dashed');

    render(
      <AnnotationsLayer
        annotations={[]}
        activeTool="arrow"
        canvasWidth={100}
        canvasHeight={100}
        onAddAnnotation={(annotation) => { added = annotation; }}
        onRemoveAnnotation={() => {}}
      />,
    );

    const layer = screen.getByTestId('annotations-layer');
    vi.spyOn(layer, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      toJSON: () => ({}),
    });

    fireEvent.mouseDown(layer, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(layer, { clientX: 70, clientY: 70 });
    fireEvent.mouseUp(layer);

    expect(added).toMatchObject({
      type: 'arrow',
      color: '#22c55e',
      variant: 'dashed',
      from: { x: 10, y: 10 },
      to: { x: 70, y: 70 },
    });
  });

  it('uses configured text font and size when adding text', () => {
    let added: Annotation | null = null;
    useAnnotationStyleStore.getState().setTextFontFamily('mono');
    useAnnotationStyleStore.getState().setTextSize(40);

    render(
      <AnnotationsLayer
        annotations={[]}
        activeTool="text"
        canvasWidth={100}
        canvasHeight={100}
        onAddAnnotation={(annotation) => { added = annotation; }}
        onRemoveAnnotation={() => {}}
      />,
    );

    const layer = screen.getByTestId('annotations-layer');
    vi.spyOn(layer, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      toJSON: () => ({}),
    });

    fireEvent.mouseDown(layer, { clientX: 20, clientY: 30 });
    fireEvent.change(screen.getByPlaceholderText('Type and press Enter'), { target: { value: 'Zoom' } });
    fireEvent.keyDown(screen.getByPlaceholderText('Type and press Enter'), { key: 'Enter' });

    expect(added).toMatchObject({
      type: 'text',
      text: 'Zoom',
      fontSize: 40,
      fontFamily: 'mono',
      pos: { x: 20, y: 30 },
    });
  });

  it('uses configured highlight color and opacity when drawing', () => {
    let added: Annotation | null = null;
    useAnnotationStyleStore.getState().setHighlightColor('#38bdf8');
    useAnnotationStyleStore.getState().setHighlightOpacity(0.65);

    render(
      <AnnotationsLayer
        annotations={[]}
        activeTool="highlight"
        canvasWidth={100}
        canvasHeight={100}
        onAddAnnotation={(annotation) => { added = annotation; }}
        onRemoveAnnotation={() => {}}
      />,
    );

    const layer = screen.getByTestId('annotations-layer');
    vi.spyOn(layer, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      toJSON: () => ({}),
    });

    fireEvent.mouseDown(layer, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(layer, { clientX: 40, clientY: 50 });
    fireEvent.mouseUp(layer);

    expect(added).toMatchObject({
      type: 'highlight',
      color: 'rgba(56, 189, 248, 0.65)',
      rect: { x: 10, y: 10, w: 30, h: 40 },
    });
  });

  it('uses configured blur type and intensity when drawing', () => {
    let added: Annotation | null = null;
    useAnnotationStyleStore.getState().setBlurVariant('frosted');
    useAnnotationStyleStore.getState().setBlurIntensity(18);

    render(
      <AnnotationsLayer
        annotations={[]}
        activeTool="blur"
        canvasWidth={100}
        canvasHeight={100}
        onAddAnnotation={(annotation) => { added = annotation; }}
        onRemoveAnnotation={() => {}}
      />,
    );

    const layer = screen.getByTestId('annotations-layer');
    vi.spyOn(layer, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      toJSON: () => ({}),
    });

    fireEvent.mouseDown(layer, { clientX: 15, clientY: 20 });
    fireEvent.mouseMove(layer, { clientX: 55, clientY: 70 });
    fireEvent.mouseUp(layer);

    expect(added).toMatchObject({
      type: 'blur',
      intensity: 18,
      variant: 'frosted',
      rect: { x: 15, y: 20, w: 40, h: 50 },
    });
  });
});
