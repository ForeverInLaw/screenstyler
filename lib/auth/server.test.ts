import { describe, it, expect, afterEach, vi } from 'vitest';
import { auth } from './server';

describe('auth server', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('exports the auth instance with a handler', () => {
    expect(auth).toBeDefined();
    expect(typeof auth.handler).toBe('function');
  });

  it.each([
    { name: 'public URL only', server: undefined, public: 'https://app.example.com', expected: 'https://app.example.com' },
    { name: 'explicit server URL', server: 'https://auth.example.com', public: 'https://app.example.com', expected: 'https://auth.example.com' },
    { name: 'local default', server: undefined, public: undefined, expected: 'http://localhost:3100' },
  ])('uses $name for Better Auth-generated URLs', async ({ server, public: publicUrl, expected }) => {
    vi.stubEnv('BETTER_AUTH_URL', server);
    vi.stubEnv('NEXT_PUBLIC_APP_URL', publicUrl);
    vi.resetModules();
    const { auth: configuredAuth } = await import('./server');
    expect((await configuredAuth.$context).baseURL).toBe(`${expected}/api/auth`);
  });
});
