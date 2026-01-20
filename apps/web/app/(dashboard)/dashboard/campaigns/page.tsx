'use client';

import dynamicImport from 'next/dynamic';
import { useWorkspace } from '../../../../hooks/use-workspace';
import { useCampaigns } from '../../../../hooks/use-campaigns';
import { CampaignStats } from '../../../../components/campaigns/campaign-stats';
import { CampaignsList } from '../../../../components/campaigns/campaigns-list';
import { Skeleton } from '../../../../components/ui/skeleton';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { AlertCircle } from 'lucide-react';

const CreateCampaignDialog = dynamicImport(
  () =>
    import('../../../../components/campaigns/create-campaign-dialog').then(
      (mod) => mod.CreateCampaignDialog,
    ),
  { ssr: false },
);

// Disable SSR for this page to avoid Radix UI + React 19 prerender issues
export const dynamic = 'force-dynamic';

export default function CampaignsPage() {
  const { workspace, loading: workspaceLoading } = useWorkspace();
  const {
    data: campaignsData = [],
    isLoading: campaignsLoading,
    error,
  } = useCampaigns(workspace?.id || '');

  const isLoading = workspaceLoading || campaignsLoading;

  // Transform backend data to match component expectations
  const campaigns = campaignsData.map((campaign) => ({
    ...campaign,
    practiceName: campaign.practice?.name || 'Sin consultorio',
    patientsCount: campaign._count?.patients || 0,
    respondedCount: campaign._count?.messages || 0,
    nps: 0, // TODO: Calculate from actual feedback
    status: campaign.status as any,
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar las campañas. Por favor, intenta de nuevo.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Campañas</h2>
          <p className="text-muted-foreground">
            Crea campañas masivas importando tu lista de pacientes.
          </p>
        </div>

        <CreateCampaignDialog
          onCreate={() => {
            // Campaign creation handled by React Query mutation
          }}
        />
      </div>

      <div className="grid gap-6">
        <CampaignStats />
        <CampaignsList
          campaigns={campaigns}
          workspaceId={workspace?.id || ''}
        />
      </div>
    </div>
  );
}
