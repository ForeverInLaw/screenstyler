import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { Resend } from 'resend';
import { getDb } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';

if (
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PHASE !== 'phase-production-build' &&
  !process.env.BETTER_AUTH_SECRET
) {
  throw new Error('BETTER_AUTH_SECRET is required in production');
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  advanced: {
    database: {
      generateId: 'uuid' as const,
    },
  },
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET ?? 'dev-insecure-secret-32-chars-______',
  emailAndPassword: {
    enabled: true,
    requireEmailVerification:
      process.env.NODE_ENV !== 'test' &&
      process.env.E2E_SKIP_EMAIL_VERIFICATION !== '1',
    sendResetPassword: async ({ user, url }) => {
      if (!resend || !process.env.RESEND_FROM) return;
      await resend.emails.send({
        from: process.env.RESEND_FROM,
        to: user.email,
        subject: 'Reset your Screenstyler password',
        text: `Reset link: ${url}`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      if (!resend || !process.env.RESEND_FROM) return;
      await resend.emails.send({
        from: process.env.RESEND_FROM,
        to: user.email,
        subject: 'Verify your Screenstyler email',
        text: `Verify link: ${url}`,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },
});

export type Session = typeof auth.$Infer.Session;
