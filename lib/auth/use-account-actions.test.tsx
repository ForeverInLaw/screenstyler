import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useEmailVerificationQuery,
  useEmailAuthMutation,
  useGoogleAuthMutation,
  usePasswordResetMutation,
} from './use-account-actions';

const mocks = vi.hoisted(() => ({ signup: vi.fn(), social: vi.fn(), verify: vi.fn(), requestReset: vi.fn(), reset: vi.fn() }));
vi.mock('./client', () => ({
  signIn: { social: mocks.social, email: vi.fn() },
  signUp: { email: mocks.signup },
  authClient: {
    verifyEmail: mocks.verify,
    requestPasswordReset: mocks.requestReset,
    resetPassword: mocks.reset,
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => vi.clearAllMocks());

describe('account request states', () => {
  it.each([null, 'session-token'])('identifies whether signup created a session (%s)', async (token) => {
    mocks.signup.mockResolvedValue({ error: null, data: { token } });
    const { result } = renderHook(() => useEmailAuthMutation(), { wrapper });
    await act(async () => {
      const response = await result.current.mutateAsync({ mode: 'signup', email: 'person@example.com', password: 'password123' });
      expect(response.isAuthenticated).toBe(Boolean(token));
    });
  });

  it('reports a returned Google provider error and finishes the pending state', async () => {
    mocks.social.mockResolvedValue({ error: { message: 'Provider unavailable' } });
    const { result } = renderHook(() => useGoogleAuthMutation(), { wrapper });
    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toThrow('Provider unavailable');
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isPending).toBe(false);
  });

  it('does not request verification when the token is missing', () => {
    const { result } = renderHook(() => useEmailVerificationQuery(''), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(mocks.verify).not.toHaveBeenCalled();
  });

  it('reports password-reset API errors instead of displaying a success message', async () => {
    mocks.requestReset.mockResolvedValue({ error: { message: 'Email delivery unavailable' } });
    const { result } = renderHook(() => usePasswordResetMutation(''), { wrapper });
    await act(async () => {
      await expect(result.current.mutateAsync({ email: 'person@example.com', password: '' })).rejects.toThrow(
        'Email delivery unavailable',
      );
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    expect(mocks.requestReset).toHaveBeenCalledWith({
      email: 'person@example.com',
      redirectTo: '/auth/reset',
    });
  });
});
