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
});

