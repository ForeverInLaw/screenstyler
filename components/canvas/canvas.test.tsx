import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRef, type ReactElement } from 'react';
import { DocumentFrame } from './DocumentFrame';
import { BackgroundLayer } from './BackgroundLayer';

vi.mock('@/lib/auth/client', () => ({
  useSession: () => ({ data: null, isPending: false }),
}));

function renderWithQueryClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('DocumentFrame', () => {
  it('renders at the given logical size and exposes its ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<DocumentFrame ref={ref} width={1200} height={630}>x</DocumentFrame>);
    const frame = screen.getByTestId('document-frame');
    expect(frame.style.width).toBe('1200px');
    expect(frame.style.height).toBe('630px');
    expect(ref.current).toBe(frame);
  });
});

describe('BackgroundLayer', () => {
  it('applies a gradient background', () => {
    renderWithQueryClient(<BackgroundLayer background={{ type: 'gradient', angle: 90,
      stops: [{ color: '#000', offset: 0 }, { color: '#fff', offset: 1 }] }} />);
    const layer = screen.getByTestId('background-layer');
    expect(layer.style.backgroundImage).toContain('linear-gradient');
  });
});
