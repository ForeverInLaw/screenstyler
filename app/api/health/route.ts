import { NextResponse } from 'next/server';

// Liveness probe for container orchestration. Reports only that the process is
// up and serving — no database or external service is touched.
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ status: 'ok' });
}
