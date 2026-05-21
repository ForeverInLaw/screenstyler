import { LocalProjectStore } from './local-project-store';
import { IdbBlobStore } from './idb-blob-store';
import { CloudProjectStore } from './cloud-project-store';
import { R2BlobStore } from './r2-blob-store';
import type { ProjectStore, BlobStore } from './types';

const localProject: ProjectStore = new LocalProjectStore();
const localBlob: BlobStore = new IdbBlobStore();
const cloudProject: ProjectStore = new CloudProjectStore();
const cloudBlob: BlobStore = new R2BlobStore();

let activeUser: { userId: string } | null = null;

export function setActiveAuth(state: { userId: string } | null): void {
  activeUser = state;
}

export function getProjectStore(): ProjectStore {
  return activeUser ? cloudProject : localProject;
}

export function getProjectStoreForUser(userId: string | null): ProjectStore {
  return userId ? cloudProject : localProject;
}

export function getBlobStore(): BlobStore {
  return activeUser ? cloudBlob : localBlob;
}

export function getBlobStoreForUser(userId: string | null): BlobStore {
  return userId ? cloudBlob : localBlob;
}

export function getActiveUserId(): string | null {
  return activeUser?.userId ?? null;
}
