import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthSync } from './AuthSync';
import { getProjectStore, setActiveAuth } from '@/lib/storage/active-stores';
import { CloudProjectStore } from '@/lib/storage/cloud-project-store';
import { LocalProjectStore } from '@/lib/storage/local-project-store';

vi.mock('@/lib/auth/client', () => ({
  useSession: vi.fn(),
}));
import { useSession } from '@/lib/auth/client';

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderWithClient(client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <AuthSync />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  setActiveAuth(null);
  vi.clearAllMocks();
});

describe('AuthSync', () => {
  it('sets the cloud store when a session is present', () => {
    (useSession as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { user: { id: 'u1' } }, isPending: false,
    });
    const client = makeClient();
    renderWithClient(client);
    expect(getProjectStore()).toBeInstanceOf(CloudProjectStore);
  });

  it('reverts to the local store when the session is gone', () => {
    const useSessionMock = useSession as unknown as ReturnType<typeof vi.fn>;
    useSessionMock.mockReturnValueOnce({ data: { user: { id: 'u1' } }, isPending: false });
    const client = makeClient();
    const { rerender } = renderWithClient(client);

    useSessionMock.mockReturnValueOnce({ data: null, isPending: false });
    rerender(
      <QueryClientProvider client={client}>
        <AuthSync />
      </QueryClientProvider>,
    );
    expect(getProjectStore()).toBeInstanceOf(LocalProjectStore);
  });

  it('removes cached project queries when session changes', () => {
    const useSessionMock = useSession as unknown as ReturnType<typeof vi.fn>;
    useSessionMock.mockReturnValueOnce({ data: { user: { id: 'u1' } }, isPending: false });
    const client = makeClient();

    // Seed stale entries in the cache.
    client.setQueryData(['projects'], [{ id: 'p1', name: 'Old' }]);
    client.setQueryData(['project', 'p1'], { version: 1 });

    const { rerender } = renderWithClient(client);

    // Session disappears.
    useSessionMock.mockReturnValueOnce({ data: null, isPending: false });
    rerender(
      <QueryClientProvider client={client}>
        <AuthSync />
      </QueryClientProvider>,
    );

    expect(client.getQueryData(['projects'])).toBeUndefined();
    expect(client.getQueryData(['project', 'p1'])).toBeUndefined();
  });

  it('does not switch stores or clear project data while the session is pending', () => {
    (useSession as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: null,
      isPending: true,
    });
    const client = makeClient();
    client.setQueryData(['projects'], [{ id: 'p1', name: 'Kept' }]);

    renderWithClient(client);

    expect(getProjectStore()).toBeInstanceOf(LocalProjectStore);
    expect(client.getQueryData(['projects'])).toEqual([{ id: 'p1', name: 'Kept' }]);
  });
});
