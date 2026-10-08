import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { CanvasStage } from './CanvasStage';
import { useEditorUiStore } from '@/lib/editor/ui-store';

beforeEach(() => useEditorUiStore.getState().resetViewportZoom());

describe('CanvasStage input', () => {
  it('ignores horizontal-only Alt scrolling', () => {
    render(<CanvasStage docWidth={1600} docHeight={1000}><div /></CanvasStage>);
    fireEvent.wheel(screen.getByTestId('canvas-stage'), { altKey: true, deltaX: 20, deltaY: 0 });
    expect(useEditorUiStore.getState().viewportZoom).toBe(1);
  });

  it('cleans up an active pan on unmount', () => {
    const { unmount } = render(<CanvasStage docWidth={1600} docHeight={1000}><div /></CanvasStage>);
    fireEvent.mouseDown(screen.getByTestId('canvas-stage'), { button: 1, clientX: 10, clientY: 10 });
    unmount();
    act(() => { fireEvent.mouseMove(window, { clientX: 100, clientY: 100 }); });
    expect(useEditorUiStore.getState().viewportOffset).toEqual({ x: 0, y: 0 });
  });
});
