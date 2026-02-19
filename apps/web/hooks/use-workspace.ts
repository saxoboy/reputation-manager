'use client';

import { useQuery } from '@tanstack/react-query';
import { workspaceService } from '../services/workspace.service';

export type { Workspace } from '../services/workspace.service';

export function useWorkspace() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspaceService.getAll(),
    select: (workspaces) => workspaces[0] ?? null,
  });

  return {
    workspace: data ?? null,
    loading: isLoading,
    error: error ? 'Error loading workspace' : null,
  };
}
