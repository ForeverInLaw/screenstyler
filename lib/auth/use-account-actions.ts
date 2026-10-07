'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authClient, signIn, signUp } from './client';

export type AuthMode = 'login' | 'signup';

export function useEmailAuthMutation() {
  return useMutation({
    mutationFn: async ({ mode, email, password }: { mode: AuthMode; email: string; password: string }) => {
      const result =
        mode === 'signup'
          ? await signUp.email({ email, password, name: email, callbackURL: '/projects' })
          : await signIn.email({ email, password, callbackURL: '/projects' });
      if (result.error) throw new Error(result.error.message ?? 'Could not sign in. Try again.');
      return { mode, email };
    },
  });
}

export function useGoogleAuthMutation() {
  return useMutation({
    mutationFn: async () => {
      const result = await signIn.social({ provider: 'google', callbackURL: '/projects' });
      if (result.error) throw new Error(result.error.message ?? 'Could not connect to Google. Try again.');
    },
  });
}

export function usePasswordResetMutation(token: string) {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const result = token
        ? await authClient.resetPassword({ token, newPassword: password })
        : await authClient.requestPasswordReset({ email, redirectTo: '/auth/reset' });
      if (result.error) throw new Error(result.error.message ?? 'Could not reset your password. Try again.');
      return token
        ? 'Password updated. You can now sign in.'
        : 'If that email is registered, a reset link is on the way.';
    },
  });
}

export function useEmailVerificationQuery(token: string) {
  return useQuery({
    queryKey: ['email-verification', token],
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const result = await authClient.verifyEmail({ query: { token } });
      if (result.error) throw new Error(result.error.message ?? 'The link may have expired.');
      return true;
    },
  });
}
