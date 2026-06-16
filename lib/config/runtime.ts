/**
 * Local-only (zero-cloud) self-host mode. When enabled the app never talks to
 * auth, Postgres, or R2: projects and blobs live entirely in the browser
 * (LocalProjectStore + IndexedDB). Toggled via the public env flag so both
 * client and server components resolve the same value.
 */
export function isLocalOnly(): boolean {
  return process.env.NEXT_PUBLIC_LOCAL_ONLY === 'true';
}
