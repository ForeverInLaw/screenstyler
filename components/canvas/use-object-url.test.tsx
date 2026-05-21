import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useObjectUrl } from './use-object-url';
import { blobStore } from '@/lib/storage/blob-store-instance';

vi.mock('@/lib/auth/client', () => ({
  useSession: () => ({ data: null, isPending: false }),
}));

beforeAll(() => {
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:fake-url');
  globalThis.URL.revokeObjectURL = vi.fn();
});

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useObjectUrl', () => {
  it('returns null for a null key', () => {
    const { result } = renderHook(() => useObjectUrl(null), { wrapper: createWrapper() });
    expect(result.current).toBeNull();
  });

  it('resolves a stored blob to an object URL', async () => {
    await blobStore.put('img-1', new Blob(['x'], { type: 'image/png' }));
    const { result } = renderHook(() => useObjectUrl('img-1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current).toBe('blob:fake-url'));
  });
});
