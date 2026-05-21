import { describe, it, expect, beforeEach, vi } from 'vitest';
vi.mock('@/lib/auth/client', () => ({
  useSession: () => ({ data: null, isPending: false }),
}));
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

  it('updates a custom gradient', () => {
    render(<BackgroundPanel />);
    fireEvent.change(screen.getByLabelText('Gradient angle'), { target: { value: '45' } });
    fireEvent.change(screen.getByLabelText('Gradient start color'), { target: { value: '#111111' } });
    expect(useDocumentStore.getState().doc.canvas.background).toMatchObject({
      type: 'gradient',
      angle: 45,
      stops: [{ color: '#111111', offset: 0 }, { color: '#ec4899', offset: 1 }],
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
