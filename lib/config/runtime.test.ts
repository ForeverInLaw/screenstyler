import { afterEach, describe, expect, it, vi } from 'vitest';
import { isLocalOnly } from './runtime';

afterEach(() => vi.unstubAllEnvs());

describe('isLocalOnly', () => {
  it('is false by default', () => {
    expect(isLocalOnly()).toBe(false);
  });

  it('is true only for the exact string "true"', () => {
    vi.stubEnv('NEXT_PUBLIC_LOCAL_ONLY', 'true');
    expect(isLocalOnly()).toBe(true);
  });

  it('is false for other truthy-looking values', () => {
    vi.stubEnv('NEXT_PUBLIC_LOCAL_ONLY', '1');
    expect(isLocalOnly()).toBe(false);
  });
});
