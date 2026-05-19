import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CanvasSizePanel } from './CanvasSizePanel';
import { useDocumentStore } from '@/lib/document/store';
import { createBlankDoc } from '@/lib/document/factory';

beforeEach(() => {
  useDocumentStore.getState().loadDoc(createBlankDoc());
  useDocumentStore.temporal.getState().clear();
});

describe('CanvasSizePanel', () => {
  it('applies a canvas size preset on click', async () => {
    render(<CanvasSizePanel />);
    await userEvent.click(screen.getByRole('button', { name: 'OG Image' }));
    const { canvas } = useDocumentStore.getState().doc;
    expect(canvas.preset).toBe('og');
    expect(canvas.width).toBe(1200);
    expect(canvas.height).toBe(630);
  });
});
