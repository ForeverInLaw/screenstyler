import { signPut, signGet, deleteObject } from './r2-server';
import { deleteLocalBlob } from './local-file-store';

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY,
  );
}

export async function serverSignPut(key: string, contentType: string, expiresIn = 300): Promise<string> {
  if (isR2Configured()) {
    return signPut(key, contentType, expiresIn);
  }
  return `/api/blobs/local?key=${encodeURIComponent(key)}`;
}

export async function serverSignGet(key: string, expiresIn = 300): Promise<string> {
  if (isR2Configured()) {
    return signGet(key, expiresIn);
  }
  return `/api/blobs/local?key=${encodeURIComponent(key)}`;
}

export async function serverDeleteObject(key: string): Promise<void> {
  if (isR2Configured()) {
    return deleteObject(key);
  }
  deleteLocalBlob(key);
}

