import { z } from 'zod';
import { requireSession, unauthorized } from '@/lib/auth/session';
import { signGet, signPut } from '@/lib/blob/r2-server';
import { ensureSchema } from '@/lib/db/client';

const body = z.object({
  key: z.string().min(1),
  op: z.enum(['put', 'get']),
  contentType: z.string().optional(),
});

export async function POST(req: Request): Promise<Response> {
  await ensureSchema();
  const session = await requireSession(req);
  if (!session) return unauthorized();
  const parsed = body.safeParse(await req.json());
  if (!parsed.success) return new Response('bad request', { status: 400 });

  const prefix = `users/${session.user.id}/`;
  if (!parsed.data.key.startsWith(prefix)) {
    return new Response('forbidden', { status: 403 });
  }

  const url =
    parsed.data.op === 'put'
      ? await signPut(parsed.data.key, parsed.data.contentType ?? 'application/octet-stream')
      : await signGet(parsed.data.key);
  return Response.json({ url, expiresIn: 300 });
}
