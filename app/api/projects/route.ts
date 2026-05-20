import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import { getDb, ensureSchema } from '@/lib/db/client';
import { projects } from '@/lib/db/schema';
import { requireSession, unauthorized } from '@/lib/auth/session';

const createBody = z.object({
  name: z.string().min(1),
  doc: z.unknown(),
  sourceImageKey: z.string().optional(),
});

export async function GET(req: Request): Promise<Response> {
  await ensureSchema();
  const session = await requireSession(req);
  if (!session) return unauthorized();
  const rows = await getDb()
    .select({
      id: projects.id,
      name: projects.name,
      thumbnailKey: projects.thumbnailKey,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .where(eq(projects.userId, session.user.id))
    .orderBy(desc(projects.updatedAt));
  return Response.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      thumbnailKey: r.thumbnailKey,
      createdAt: r.createdAt.getTime(),
      updatedAt: r.updatedAt.getTime(),
    })),
  );
}

export async function POST(req: Request): Promise<Response> {
  await ensureSchema();
  const session = await requireSession(req);
  if (!session) return unauthorized();
  const parsed = createBody.safeParse(await req.json());
  if (!parsed.success) return new Response('bad request', { status: 400 });
  const [row] = await getDb()
    .insert(projects)
    .values({
      userId: session.user.id,
      name: parsed.data.name,
      doc: parsed.data.doc as object,
      sourceImageKey: parsed.data.sourceImageKey ?? null,
    })
    .returning();
  return Response.json({ id: row.id });
}
