import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { requireSession, unauthorized } from '@/lib/auth/session';
import { signGet, signPut } from '@/lib/blob/r2-server';
import { getDb, ensureSchema } from '@/lib/db/client';
import { projects } from '@/lib/db/schema';

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
  let allowed = parsed.data.key.startsWith(prefix);

  if (!allowed && parsed.data.op === 'get') {
    // Check if it's a legacy thumbnail key format: thumbnail_<projectId>
    const match = parsed.data.key.match(/^thumbnail_(.+)$/);
    if (match) {
      const projectId = match[1];
      const [projectRow] = await getDb()
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)));
      if (projectRow) {
        allowed = true;
      }
    }
  }

  if (!allowed) {
    return new Response('forbidden', { status: 403 });
  }

  const url =
    parsed.data.op === 'put'
      ? await signPut(parsed.data.key, parsed.data.contentType ?? 'application/octet-stream')
      : await signGet(parsed.data.key);
  return Response.json({ url, expiresIn: 300 });
}
