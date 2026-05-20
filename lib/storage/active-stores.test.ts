import { describe, it, expect, beforeEach } from 'vitest';
import { getProjectStore, getBlobStore, setActiveAuth, getActiveUserId } from './active-stores';
import { LocalProjectStore } from './local-project-store';
import { IdbBlobStore } from './idb-blob-store';
import { CloudProjectStore } from './cloud-project-store';
import { R2BlobStore } from './r2-blob-store';

beforeEach(() => setActiveAuth(null));

describe('active stores', () => {
  it('defaults to local + idb when no session', () => {
    expect(getProjectStore()).toBeInstanceOf(LocalProjectStore);
    expect(getBlobStore()).toBeInstanceOf(IdbBlobStore);
    expect(getActiveUserId()).toBeNull();
  });

  it('switches to cloud + r2 when a session is set', () => {
    setActiveAuth({ userId: 'u1' });
    expect(getProjectStore()).toBeInstanceOf(CloudProjectStore);
    expect(getBlobStore()).toBeInstanceOf(R2BlobStore);
    expect(getActiveUserId()).toBe('u1');
  });

  it('reverts to local when the session is cleared', () => {
    setActiveAuth({ userId: 'u1' });
    setActiveAuth(null);
    expect(getProjectStore()).toBeInstanceOf(LocalProjectStore);
    expect(getBlobStore()).toBeInstanceOf(IdbBlobStore);
    expect(getActiveUserId()).toBeNull();
  });
});
