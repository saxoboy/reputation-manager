'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '../../hooks/use-workspace';

export function WorkspaceGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { workspace, loading } = useWorkspace();

  useEffect(() => {
    if (!loading && workspace === null) {
      router.replace('/onboarding');
    }
  }, [loading, workspace, router]);

  // While loading or redirecting, show nothing
  if (loading || workspace === null) {
    return null;
  }

  return <>{children}</>;
}
