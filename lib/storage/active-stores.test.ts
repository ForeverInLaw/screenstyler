import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  blobStoreScopeForKey,
  getActiveUserId,
  getBlobStore,
  getBlobStoreForKey,
  getProjectStore,
  setActiveAuth,
} from './active-stores';
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

  it('routes blob reads by ownership of the key', () => {
    expect(blobStoreScopeForKey('u1', 'users/u1/img')).toBe('cloud');
    expect(getBlobStoreForKey('users/u1/img', 'u1')).toBeInstanceOf(R2BlobStore);

    expect(blobStoreScopeForKey('u1', 'img-legacy')).toBe('local');
    expect(getBlobStoreForKey('img-legacy', 'u1')).toBeInstanceOf(IdbBlobStore);

    expect(blobStoreScopeForKey('u1', 'users/u2/img')).toBe('local');
    expect(getBlobStoreForKey('users/u2/img', 'u1')).toBeInstanceOf(IdbBlobStore);
  });

  it('keeps legacy cloud thumbnails on the cloud store for signed-in users', () => {
    expect(blobStoreScopeForKey('u1', 'thumbnail_p1')).toBe('cloud');
    expect(getBlobStoreForKey('thumbnail_p1', 'u1')).toBeInstanceOf(R2BlobStore);
  });
});

describe('active stores — local-only mode', () => {
  beforeEach(() => vi.stubEnv('NEXT_PUBLIC_LOCAL_ONLY', 'true'));
  afterEach(() => {
    vi.unstubAllEnvs();
    setActiveAuth(null);
  });

  it('forces local + idb even when a session is set', () => {
    setActiveAuth({ userId: 'u1' });
    expect(getProjectStore()).toBeInstanceOf(LocalProjectStore);
    expect(getBlobStore()).toBeInstanceOf(IdbBlobStore);
    expect(getActiveUserId()).toBeNull();
  });

  it('routes owned cloud keys to the local store', () => {
    expect(blobStoreScopeForKey('u1', 'users/u1/img')).toBe('local');
    expect(getBlobStoreForKey('users/u1/img', 'u1')).toBeInstanceOf(IdbBlobStore);
    expect(blobStoreScopeForKey('u1', 'thumbnail_p1')).toBe('local');
  });
});
