import { auth, type Session } from './server';

export async function requireSession(req: Request): Promise<Session | null> {
  const session = await auth.api.getSession({ headers: req.headers });
  return session ?? null;
}

export function unauthorized(): Response {
  return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), {
    status: 401,
    headers: { 'content-type': 'application/json' },
  });
}
