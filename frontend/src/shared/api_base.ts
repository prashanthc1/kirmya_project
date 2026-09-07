/**
 * The single API base convention.
 *
 * `NEXT_PUBLIC_API_URL` **includes** the `/api/v1` prefix. Every deployment
 * environment already sets it that way (`frontend/.env`, `.env.example`, and
 * all three CI workflows all use `http://…:8080/api/v1`), so a caller must
 * append only the resource path:
 *
 *     apiUrl('/jobs')                -> http://…:8080/api/v1/jobs
 *     apiUrl('/telemetry/vitals')    -> http://…:8080/api/v1/telemetry/vitals
 *
 * The telemetry callers previously assumed the opposite and built
 * `${NEXT_PUBLIC_API_URL}/api/v1/telemetry/…`, which against the configured
 * value produced a doubled `/api/v1/api/v1/…` and a 404 on every client error
 * and web-vitals report. Anything that needs the base must come through here
 * rather than re-deriving it, so that the two conventions cannot drift again.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

/** Joins a resource path onto the API base, tolerating a missing leading slash. */
export function apiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}
