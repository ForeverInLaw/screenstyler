import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { AuthSync } from './AuthSync';
import { getProjectStore, setActiveAuth } from '@/lib/storage/active-stores';
import { CloudProjectStore } from '@/lib/storage/cloud-project-store';
import { LocalProjectStore } from '@/lib/storage/local-project-store';

vi.mock('@/lib/auth/client', () => ({
  useSession: vi.fn(),
}));
import { useSession } from '@/lib/auth/client';

beforeEach(() => {
  setActiveAuth(null);
  vi.clearAllMocks();
});

describe('AuthSync', () => {
  it('sets the cloud store when a session is present', () => {
    (useSession as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { user: { id: 'u1' } }, isPending: false,
    });
    render(<AuthSync />);
    expect(getProjectStore()).toBeInstanceOf(CloudProjectStore);
  });

  it('reverts to the local store when the session is gone', () => {
    const useSessionMock = useSession as unknown as ReturnType<typeof vi.fn>;
    useSessionMock.mockReturnValueOnce({ data: { user: { id: 'u1' } }, isPending: false });
    const { rerender } = render(<AuthSync />);

    useSessionMock.mockReturnValueOnce({ data: null, isPending: false });
    rerender(<AuthSync />);
    expect(getProjectStore()).toBeInstanceOf(LocalProjectStore);
  });
});
