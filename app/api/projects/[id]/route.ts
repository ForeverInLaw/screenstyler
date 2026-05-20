import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { getDb, ensureSchema } from '@/lib/db/client';
import { projects } from '@/lib/db/schema';
import { requireSession, unauthorized } from '@/lib/auth/session';
import { deleteObject } from '@/lib/blob/r2-server';

const patchBody = z.object({
  doc: z.unknown().optional(),
  meta: z.object({ name: z.string().min(1).optional() }).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx): Promise<Response> {
  await ensureSchema();
  const session = await requireSession(req);
  if (!session) return unauthorized();
  const { id } = await ctx.params;
  const [row] = await getDb()
    .select({ doc: projects.doc })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)));
  if (!row) return new Response('not found', { status: 404 });
  return Response.json(row.doc);
}

export async function PATCH(req: Request, ctx: Ctx): Promise<Response> {
  await ensureSchema();
  const session = await requireSession(req);
  if (!session) return unauthorized();
  const { id } = await ctx.params;
  const parsed = patchBody.safeParse(await req.json());
  if (!parsed.success) return new Response('bad request', { status: 400 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.doc !== undefined) updates.doc = parsed.data.doc;
  if (parsed.data.meta?.name) updates.name = parsed.data.meta.name;

  const result = await getDb()
    .update(projects)
    .set(updates)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))
    .returning();
  if (result.length === 0) return new Response('not found', { status: 404 });
  return Response.json({});
}

export async function DELETE(req: Request, ctx: Ctx): Promise<Response> {
  await ensureSchema();
  const session = await requireSession(req);
  if (!session) return unauthorized();
  const { id } = await ctx.params;

  // Look up the storage keys before deleting so we can clean up R2 objects.
  const [row] = await getDb()
    .select({ sourceImageKey: projects.sourceImageKey, thumbnailKey: projects.thumbnailKey })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)));
  if (!row) return new Response('not found', { status: 404 });

  await getDb()
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)));

  // Fire-and-forget R2 deletions — don't fail the response if R2 errors.
  for (const key of [row.sourceImageKey, row.thumbnailKey]) {
    if (key) {
      deleteObject(key).catch((e) => console.warn('R2 delete failed', key, e));
    }
  }

  return Response.json({});
}
