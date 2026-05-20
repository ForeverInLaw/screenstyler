import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function makeClient(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
  });
}

const bucket = (): string => process.env.R2_BUCKET ?? 'screenstyler';

export async function signPut(key: string, contentType: string, expiresIn = 300): Promise<string> {
  return getSignedUrl(
    makeClient(),
    new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }),
    { expiresIn },
  );
}

export async function signGet(key: string, expiresIn = 300): Promise<string> {
  return getSignedUrl(
    makeClient(),
    new GetObjectCommand({ Bucket: bucket(), Key: key }),
    { expiresIn },
  );
}

export async function deleteObject(key: string): Promise<void> {
  await makeClient().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}
