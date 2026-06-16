import { LocalProjectStore } from './local-project-store';
import { IdbBlobStore } from './idb-blob-store';
import { CloudProjectStore } from './cloud-project-store';
import { R2BlobStore } from './r2-blob-store';
import { isLocalOnly } from '../config/runtime';
import type { ProjectStore, BlobStore } from './types';

const localProject: ProjectStore = new LocalProjectStore();
const localBlob: BlobStore = new IdbBlobStore();
const cloudProject: ProjectStore = new CloudProjectStore();
const cloudBlob: BlobStore = new R2BlobStore();

let activeUser: { userId: string } | null = null;

export function setActiveAuth(state: { userId: string } | null): void {
  activeUser = isLocalOnly() ? null : state;
}

export function getProjectStore(): ProjectStore {
  return activeUser ? cloudProject : localProject;
}

export function getProjectStoreForUser(userId: string | null): ProjectStore {
  return userId && !isLocalOnly() ? cloudProject : localProject;
}

export function getBlobStore(): BlobStore {
  return activeUser ? cloudBlob : localBlob;
}

export function getBlobStoreForUser(userId: string | null): BlobStore {
  return userId && !isLocalOnly() ? cloudBlob : localBlob;
}

export function blobStoreScopeForKey(userId: string | null, blobKey: string | null): 'cloud' | 'local' {
  if (isLocalOnly() || !userId || !blobKey) return 'local';
  if (blobKey.startsWith(`users/${userId}/`)) return 'cloud';
  if (blobKey.startsWith('thumbnail_')) return 'cloud';
  return 'local';
}

export function getBlobStoreForKey(blobKey: string | null, userId: string | null): BlobStore {
  return blobStoreScopeForKey(userId, blobKey) === 'cloud' ? cloudBlob : localBlob;
}

export function getActiveUserId(): string | null {
  return activeUser?.userId ?? null;
}
