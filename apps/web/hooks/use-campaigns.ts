import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  campaignService,
  type CreateCampaignDto,
  type UpdateCampaignDto,
} from '../services/campaign.service';

export function useCampaigns(workspaceId: string) {
  return useQuery({
    queryKey: ['campaigns', workspaceId],
    queryFn: () => campaignService.getAll(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useCampaign(workspaceId: string, campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', workspaceId, campaignId],
    queryFn: () => campaignService.getById(workspaceId, campaignId),
    enabled: !!workspaceId && !!campaignId,
  });
}

export function useCreateCampaign(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCampaignDto) =>
      campaignService.create(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId] });
      toast.success('Campaña creada exitosamente');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Error al crear la campaña',
      );
    },
  });
}

export function useUpdateCampaign(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      data,
    }: {
      campaignId: string;
      data: UpdateCampaignDto;
    }) => campaignService.update(workspaceId, campaignId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId] });
      queryClient.invalidateQueries({
        queryKey: ['campaigns', workspaceId, variables.campaignId],
      });
      toast.success('Campaña actualizada exitosamente');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al actualizar la campaña',
      );
    },
  });
}

export function useDeleteCampaign(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: string) =>
      campaignService.delete(workspaceId, campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId] });
      toast.success('Campaña eliminada exitosamente');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Error al eliminar la campaña',
      );
    },
  });
}

export function useUploadCsv(workspaceId: string, campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) =>
      campaignService.uploadCsv(workspaceId, campaignId, file),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', workspaceId, campaignId],
      });
      toast.success(`${result.imported} pacientes importados`);
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} errores en la importación`);
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Error al subir el archivo',
      );
    },
  });
}
