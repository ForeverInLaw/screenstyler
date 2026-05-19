import { IdbBlobStore } from './idb-blob-store';
import type { BlobStore } from './types';

export const blobStore: BlobStore = new IdbBlobStore();
