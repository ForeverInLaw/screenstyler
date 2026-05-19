import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BackgroundPanel } from './BackgroundPanel';
import { StylePanel } from './StylePanel';
import { useDocumentStore } from '@/lib/document/store';
import { createBlankDoc } from '@/lib/document/factory';

beforeEach(() => {
  useDocumentStore.getState().loadDoc(createBlankDoc());
  useDocumentStore.temporal.getState().clear();
});

describe('BackgroundPanel', () => {
  it('applies a gradient preset on click', async () => {
    render(<BackgroundPanel />);
    await userEvent.click(screen.getByRole('button', { name: 'Ocean' }));
    expect(useDocumentStore.getState().doc.canvas.background).toMatchObject({
      type: 'gradient',
    });
  });
});

describe('StylePanel', () => {
  it('updates padding from the slider', () => {
    render(<StylePanel />);
    const slider = screen.getByLabelText('Padding');
    fireEvent.change(slider, { target: { value: '150' } });
    expect(useDocumentStore.getState().doc.content.padding).toBe(150);
  });
});
