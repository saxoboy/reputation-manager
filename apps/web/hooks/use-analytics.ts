import { useQuery } from '@tanstack/react-query';
import {
  analyticsService,
  type WorkspaceAnalytics,
} from '../services/analytics.service';

export function useWorkspaceAnalytics(workspaceId: string) {
  return useQuery<WorkspaceAnalytics>({
    queryKey: ['analytics', workspaceId],
    queryFn: () => analyticsService.getWorkspaceAnalytics(workspaceId),
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
