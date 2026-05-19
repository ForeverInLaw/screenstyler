import { describe, it, expect, vi, beforeAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useObjectUrl } from './use-object-url';
import { blobStore } from '@/lib/storage/blob-store-instance';

beforeAll(() => {
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:fake-url');
  globalThis.URL.revokeObjectURL = vi.fn();
});

describe('useObjectUrl', () => {
  it('returns null for a null key', () => {
    const { result } = renderHook(() => useObjectUrl(null));
    expect(result.current).toBeNull();
  });

  it('resolves a stored blob to an object URL', async () => {
    await blobStore.put('img-1', new Blob(['x'], { type: 'image/png' }));
    const { result } = renderHook(() => useObjectUrl('img-1'));
    await waitFor(() => expect(result.current).toBe('blob:fake-url'));
  });
});
