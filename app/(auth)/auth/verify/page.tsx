'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { IconCircleCheck, IconAlertCircle } from '@tabler/icons-react';
import { AccountShell } from '@/components/auth/AccountShell';
import { useEmailVerificationQuery } from '@/lib/auth/use-account-actions';

function VerifyInner() {
  const token = useSearchParams().get('token') ?? '';
  const verification = useEmailVerificationQuery(token);
  return (
    <AccountShell>
      {verification.isLoading ? (
        <p role="status" className="text-sm text-secondary">
          Verifying your email...
        </p>
      ) : (
        <>
          {verification.data ? (
            <IconCircleCheck size={32} stroke={1.5} className="mb-5 text-success" aria-hidden="true" />
          ) : (
            <IconAlertCircle size={32} stroke={1.5} className="mb-5 text-danger" aria-hidden="true" />
          )}
          <h1 className="text-2xl font-medium tracking-tight">
            {verification.data ? 'Email verified.' : 'Verification failed.'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-secondary">
            {verification.data
              ? 'Your account is ready. Sign in to open your workspace.'
              : 'The link may have expired. Request another verification email by signing in.'}
          </p>
        </>
      )}
    </AccountShell>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
