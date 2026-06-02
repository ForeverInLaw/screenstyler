import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { getDb, ensureSchema } from '@/lib/db/client';
import { projects } from '@/lib/db/active-schema';
import { requireSession, unauthorized } from '@/lib/auth/session';
import { serverDeleteObject } from '@/lib/blob/server-store';
import { collectBlobKeys } from '@/lib/document/blob-refs';

const patchBody = z.object({
  doc: z.unknown().optional(),
  meta: z.object({
    name: z.string().min(1).optional(),
    thumbnailKey: z.string().nullable().optional(),
  }).optional(),
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
  if (parsed.data.meta?.thumbnailKey !== undefined) updates.thumbnailKey = parsed.data.meta.thumbnailKey;

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

  // Look up the storage keys before deleting so we can clean up blob objects.
  const [row] = await getDb()
    .select({
      doc: projects.doc,
      sourceImageKey: projects.sourceImageKey,
      thumbnailKey: projects.thumbnailKey,
    })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)));
  if (!row) return new Response('not found', { status: 404 });

  await getDb()
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)));

  // Candidate blob keys: per-screenshot images + background (from the doc),
  // plus the legacy source image and thumbnail. ALL of these come from
  // user-controlled inputs (doc/sourceImageKey/thumbnailKey are set verbatim by
  // the client), so a malicious doc could reference another tenant's keys.
  // Filter to keys this user provably owns before deleting — anything else is
  // skipped and logged. Owned = the `users/<id>/` prefix the blob routes
  // enforce, or the legacy `thumbnail_<projectId>` format for THIS project,
  // which we already confirmed belongs to the session user above.
  const ownedPrefix = `users/${session.user.id}/`;
  const legacyThumbKey = `thumbnail_${id}`;
  const candidates = new Set<string>([
    ...collectBlobKeys(row.doc),
    ...(row.sourceImageKey ? [row.sourceImageKey] : []),
    ...(row.thumbnailKey ? [row.thumbnailKey] : []),
  ]);
  for (const key of candidates) {
    if (key.startsWith(ownedPrefix) || key === legacyThumbKey) {
      // Fire-and-forget — don't fail the response on a blob cleanup error.
      serverDeleteObject(key).catch((e) => console.warn('blob delete failed', key, e));
    } else {
      console.warn('skipping foreign blob key on project delete', key);
    }
  }

  return Response.json({});
}
