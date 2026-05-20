import { auth } from '@/lib/auth/server';
import { toNextJsHandler } from 'better-auth/next-js';
import { ensureSchema } from '@/lib/db/client';

const { GET: authGet, POST: authPost } = toNextJsHandler(auth);

export async function GET(req: Request): Promise<Response> {
  await ensureSchema();
  return authGet(req);
}

export async function POST(req: Request): Promise<Response> {
  await ensureSchema();
  return authPost(req);
}
