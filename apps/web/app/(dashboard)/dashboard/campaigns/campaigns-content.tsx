'use client';

import { useState } from 'react';
import dynamicImport from 'next/dynamic';
import { useWorkspace } from '../../../../hooks/use-workspace';
import { useCampaigns } from '../../../../hooks/use-campaigns';
import { CampaignStats } from '../../../../components/campaigns/campaign-stats';
import { CampaignsList } from '../../../../components/campaigns/campaigns-list';
import { Skeleton } from '../../../../components/ui/skeleton';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { Button } from '../../../../components/ui/button';
import { AlertCircle, Download, Loader2 } from 'lucide-react';
import { campaignService } from '../../../../services/campaign.service';
import { toast } from 'sonner';

const CreateCampaignDialog = dynamicImport(
  () =>
    import('../../../../components/campaigns/create-campaign-dialog').then(
      (mod) => mod.CreateCampaignDialog,
    ),
  { ssr: false },
);

export default function CampaignsContent() {
  const { workspace, loading: workspaceLoading } = useWorkspace();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadTemplate = async () => {
    if (!workspace?.id) return;
    setIsDownloading(true);
    try {
      await campaignService.downloadExcelTemplate(workspace.id);
    } catch {
      toast.error('Error al descargar la plantilla');
    } finally {
      setIsDownloading(false);
    }
  };
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
      <div className="space-y-6 max-w-7xl mx-auto">
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Campañas
          </h2>
          <p className="text-sm text-muted-foreground">
            Crea campañas masivas importando tu lista de pacientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadTemplate}
            disabled={isDownloading || !workspace?.id}
            className="text-muted-foreground"
          >
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Descargar plantilla Excel
          </Button>
          <CreateCampaignDialog workspaceId={workspace?.id || ''} />
        </div>
      </div>

      <div className="grid gap-6">
        <CampaignStats workspaceId={workspace?.id || ''} />
        <CampaignsList
          campaigns={campaigns}
          workspaceId={workspace?.id || ''}
        />
      </div>
    </div>
  );
}
