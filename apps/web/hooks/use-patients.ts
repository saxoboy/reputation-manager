import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  patientService,
  type CreatePatientDto,
  type UpdatePatientDto,
} from '../services/patient.service';

export function usePatients(
  workspaceId: string,
  filters?: {
    campaignId?: string;
    hasConsent?: boolean;
    optedOut?: boolean;
  },
) {
  return useQuery({
    queryKey: ['patients', workspaceId, filters],
    queryFn: () => patientService.getAll(workspaceId, filters),
    enabled: !!workspaceId,
  });
}

export function useCampaignPatients(workspaceId: string, campaignId: string) {
  return useQuery({
    queryKey: ['patients', 'campaign', workspaceId, campaignId],
    queryFn: () => patientService.getByCampaign(workspaceId, campaignId),
    enabled: !!workspaceId && !!campaignId,
  });
}

export function usePatient(workspaceId: string, patientId: string) {
  return useQuery({
    queryKey: ['patients', workspaceId, patientId],
    queryFn: () => patientService.getById(workspaceId, patientId),
    enabled: !!workspaceId && !!patientId,
  });
}

export function usePatientStats(workspaceId: string) {
  return useQuery({
    queryKey: ['patients', 'stats', workspaceId],
    queryFn: () => patientService.getStats(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useCreatePatient(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePatientDto) =>
      patientService.create(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', workspaceId] });
      queryClient.invalidateQueries({
        queryKey: ['patients', 'stats', workspaceId],
      });
      toast.success('Paciente creado exitosamente');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Error al crear el paciente',
      );
    },
  });
}

export function useUpdatePatient(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      patientId,
      data,
    }: {
      patientId: string;
      data: UpdatePatientDto;
    }) => patientService.update(workspaceId, patientId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patients', workspaceId] });
      queryClient.invalidateQueries({
        queryKey: ['patients', workspaceId, variables.patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ['patients', 'stats', workspaceId],
      });
      toast.success('Paciente actualizado exitosamente');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al actualizar el paciente',
      );
    },
  });
}

export function useDeletePatient(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patientId: string) =>
      patientService.delete(workspaceId, patientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', workspaceId] });
      queryClient.invalidateQueries({
        queryKey: ['patients', 'stats', workspaceId],
      });
      toast.success('Paciente eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al eliminar el paciente',
      );
    },
  });
}

export function useOptOutPatient(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patientId: string) =>
      patientService.optOut(workspaceId, patientId),
    onSuccess: (_, patientId) => {
      queryClient.invalidateQueries({ queryKey: ['patients', workspaceId] });
      queryClient.invalidateQueries({
        queryKey: ['patients', workspaceId, patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ['patients', 'stats', workspaceId],
      });
      toast.success('Paciente marcado como opt-out exitosamente');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al marcar paciente como opt-out',
      );
    },
  });
}
