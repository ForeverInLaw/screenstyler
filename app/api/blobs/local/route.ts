import { NextRequest } from 'next/server';
import { getLocalBlob, putLocalBlob, deleteLocalBlob } from '@/lib/blob/local-file-store';
import { requireSession, unauthorized } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { projects } from '@/lib/db/active-schema';
import { and, eq } from 'drizzle-orm';

async function isAllowedKey(key: string | null, userId: string): Promise<boolean> {
  if (!key) return false;
  if (key.startsWith(`users/${userId}/`)) return true;
  // Allow thumbnail keys that belong to the user's projects
  const match = key.match(/^thumbnail_(.+)$/);
  if (match) {
    const projectId = match[1];
    const [row] = await getDb()
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
    if (row) return true;
  }
  return false;
}


export async function GET(req: NextRequest): Promise<Response> {
  const session = await requireSession(req);
  if (!session) return unauthorized();

  const key = req.nextUrl.searchParams.get('key');
  if (!key) return new Response('missing key', { status: 400 });
  if (!(await isAllowedKey(key, session.user.id))) return new Response('forbidden', { status: 403 });

  const blob = getLocalBlob(key);
  if (!blob) return new Response('not found', { status: 404 });

  return new Response(blob.data.buffer as ArrayBuffer, {
    headers: { 'content-type': blob.contentType },
  });
}

export async function PUT(req: NextRequest): Promise<Response> {
  const session = await requireSession(req);
  if (!session) return unauthorized();

  const key = req.nextUrl.searchParams.get('key');
  if (!key) return new Response('missing key', { status: 400 });
  if (!(await isAllowedKey(key, session.user.id))) return new Response('forbidden', { status: 403 });

  const contentType = req.headers.get('content-type') ?? 'application/octet-stream';
  const body = await req.arrayBuffer();
  const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
  if (body.byteLength > MAX_SIZE) {
    return new Response('payload too large', { status: 413 });
  }
  const data = Buffer.from(body);
  putLocalBlob(key, data, contentType);
  return new Response('ok');
}

export async function DELETE(req: NextRequest): Promise<Response> {
  const session = await requireSession(req);
  if (!session) return unauthorized();

  const key = req.nextUrl.searchParams.get('key');
  if (!key) return new Response('missing key', { status: 400 });
  if (!(await isAllowedKey(key, session.user.id))) return new Response('forbidden', { status: 403 });

  deleteLocalBlob(key);
  return new Response('ok');
}
