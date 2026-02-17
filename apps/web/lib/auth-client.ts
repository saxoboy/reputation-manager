import { createAuthClient } from 'better-auth/react';
import { getBaseUrl } from './get-base-url';

export const authClient = createAuthClient({
  baseURL: `${getBaseUrl()}/api/auth`,
});

export const { signIn, signUp, signOut, useSession } = authClient;
