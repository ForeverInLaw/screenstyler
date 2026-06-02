import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { ContentLayer } from './ContentLayer';
import { blobStore } from '@/lib/storage/blob-store-instance';
import type { ScreenstylerDoc } from '@/lib/document/schema';

vi.mock('@/lib/auth/client', () => ({
  useSession: () => ({ data: null, isPending: false }),
}));

function renderWithQueryClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeAll(() => {
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:fake-url');
  globalThis.URL.revokeObjectURL = vi.fn();
});

const content: ScreenstylerDoc['content'] = {
  image: { id: 'i1', blobKey: 'shot-1', naturalWidth: 800, naturalHeight: 500 },
  padding: 80,
  cornerRadius: 16,
  shadow: { x: 0, y: 10, blur: 30, spread: 0, color: '#000000', opacity: 0.3 },
  frame: { type: 'none' },
  transform3d: { rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 1500, scale: 1 },
};

describe('ContentLayer', () => {
  it('renders nothing when there is no image', () => {
    renderWithQueryClient(<ContentLayer content={{ ...content, image: null }} />);
    expect(screen.queryByTestId('screenshot')).toBeNull();
  });

  it('applies padding, corner radius, and shadow', async () => {
    await blobStore.put('shot-1', new Blob(['x'], { type: 'image/png' }));
    renderWithQueryClient(<ContentLayer content={content} />);
    const wrapper = screen.getByTestId('content-layer');
    expect(wrapper.style.paddingLeft).toBe('80px');
    const shot = await waitFor(() => screen.getByTestId('screenshot'));
    expect(shot.style.borderRadius).toBe('16px');
    expect(shot.style.boxShadow).toContain('rgba(0, 0, 0, 0.3)');
  });

  it('renders multiple screenshots with their z-index matching their index in the array', async () => {
    await blobStore.put('shot-1', new Blob(['x'], { type: 'image/png' }));
    await blobStore.put('shot-2', new Blob(['y'], { type: 'image/png' }));

    const screenshots = [
      { id: 's1', image: { id: 'i1', blobKey: 'shot-1', naturalWidth: 800, naturalHeight: 500 }, x: 10, y: 10, width: 800, height: 500, scale: 1 },
      { id: 's2', image: { id: 'i2', blobKey: 'shot-2', naturalWidth: 800, naturalHeight: 500 }, x: 20, y: 20, width: 800, height: 500, scale: 1 },
    ];

    renderWithQueryClient(
      <ContentLayer content={{ ...content, screenshots }} />
    );

    const items = await waitFor(() => {
      const result = screen.getAllByTestId('screenshot-item');
      expect(result).toHaveLength(2);
      return result;
    });

    expect(items[0].style.zIndex).toBe('0');
    expect(items[1].style.zIndex).toBe('1');
  });
});
