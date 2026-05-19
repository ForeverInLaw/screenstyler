import { describe, it, expect } from 'vitest';
import { users, sessions, accounts, verifications, projects } from './schema';

describe('db schema', () => {
  it('exports all required tables', () => {
    expect(users).toBeDefined();
    expect(sessions).toBeDefined();
    expect(accounts).toBeDefined();
    expect(verifications).toBeDefined();
    expect(projects).toBeDefined();
  });
});
