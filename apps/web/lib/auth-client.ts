import { createAuthClient } from 'better-auth/react';

// Use relative URL so requests go through Vercel rewrites (same domain = cookies work)
// In the browser: /api/auth → Vercel proxy → Railway API
// On server (SSR): needs full URL
const BASE_URL =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
    : '';

export const authClient = createAuthClient({
  baseURL: `${BASE_URL}/api/auth`,
});

export const { signIn, signUp, signOut, useSession } = authClient;
