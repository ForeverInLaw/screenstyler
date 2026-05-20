// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { signPut } from './r2-server';

beforeEach(() => {
  process.env.R2_ENDPOINT = 'https://account-id.r2.cloudflarestorage.com';
  process.env.R2_ACCESS_KEY_ID = 'access-key';
  process.env.R2_SECRET_ACCESS_KEY = 'secret-key';
  process.env.R2_BUCKET = 'screenstyler-dev';
});

describe('R2 presigned URLs', () => {
  it('does not add unsupported checksum query parameters to browser PUT URLs', async () => {
    const url = await signPut('users/u/image.png', 'image/png');
    expect(url).not.toContain('x-amz-checksum-crc32');
    expect(url).not.toContain('x-amz-sdk-checksum-algorithm');
  });
});
