'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession as useBetterAuthSession } from '../lib/auth-client';

export function useAuth(requireAuth = true) {
  const { data: session, isPending, error } = useBetterAuthSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && requireAuth && !session) {
      router.push('/login');
    }
  }, [session, isPending, requireAuth, router]);

  return {
    user: session?.user,
    session,
    isPending,
    error,
    isAuthenticated: !!session,
  };
}
