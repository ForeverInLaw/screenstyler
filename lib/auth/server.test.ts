import { describe, it, expect } from 'vitest';
import { auth } from './server';

describe('auth server', () => {
  it('exports the auth instance with a handler', () => {
    expect(auth).toBeDefined();
    expect(typeof auth.handler).toBe('function');
  });
});
