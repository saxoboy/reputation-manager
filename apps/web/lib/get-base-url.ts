/**
 * Returns the correct base URL for API requests.
 * - Browser: uses same origin so requests go through Vercel rewrites (cookies work)
 * - Server (SSR): uses NEXT_PUBLIC_API_URL directly
 */
export function getBaseUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
  }
  return window.location.origin;
}
