import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  messageService,
  type CreateMessageDto,
  type UpdateMessageDto,
  type SimulateResponseDto,
} from '../services/message.service';
import { MessageStatus, MessageType } from '../types/mock-types';

export function useMessages(
  workspaceId: string,
  filters?: {
    campaignId?: string;
    patientId?: string;
    status?: MessageStatus;
    type?: MessageType;
  },
) {
  return useQuery({
    queryKey: ['messages', workspaceId, filters],
    queryFn: () => messageService.getAll(workspaceId, filters),
    enabled: !!workspaceId,
  });
}

export function useCampaignMessages(workspaceId: string, campaignId: string) {
  return useQuery({
    queryKey: ['messages', 'campaign', workspaceId, campaignId],
    queryFn: () => messageService.getByCampaign(workspaceId, campaignId),
    enabled: !!workspaceId && !!campaignId,
  });
}

export function usePatientMessages(workspaceId: string, patientId: string) {
  return useQuery({
    queryKey: ['messages', 'patient', workspaceId, patientId],
    queryFn: () => messageService.getByPatient(workspaceId, patientId),
    enabled: !!workspaceId && !!patientId,
  });
}

export function useMessage(workspaceId: string, messageId: string) {
  return useQuery({
    queryKey: ['messages', workspaceId, messageId],
    queryFn: () => messageService.getById(workspaceId, messageId),
    enabled: !!workspaceId && !!messageId,
  });
}

export function useMessageStats(workspaceId: string) {
  return useQuery({
    queryKey: ['messages', 'stats', workspaceId],
    queryFn: () => messageService.getStats(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useCreateMessage(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMessageDto) =>
      messageService.create(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', workspaceId] });
      queryClient.invalidateQueries({
        queryKey: ['messages', 'stats', workspaceId],
      });
      toast.success('Mensaje enviado exitosamente');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Error al enviar el mensaje',
      );
    },
  });
}

export function useUpdateMessage(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      data,
    }: {
      messageId: string;
      data: UpdateMessageDto;
    }) => messageService.update(workspaceId, messageId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', workspaceId] });
      queryClient.invalidateQueries({
        queryKey: ['messages', workspaceId, variables.messageId],
      });
      queryClient.invalidateQueries({
        queryKey: ['messages', 'stats', workspaceId],
      });
      toast.success('Mensaje actualizado exitosamente');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al actualizar el mensaje',
      );
    },
  });
}

export function useDeleteMessage(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) =>
      messageService.delete(workspaceId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', workspaceId] });
      queryClient.invalidateQueries({
        queryKey: ['messages', 'stats', workspaceId],
      });
      toast.success('Mensaje eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Error al eliminar el mensaje',
      );
    },
  });
}

export function useSimulateResponse(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      data,
    }: {
      messageId: string;
      data: SimulateResponseDto;
    }) => messageService.simulateResponse(workspaceId, messageId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', workspaceId] });
      queryClient.invalidateQueries({
        queryKey: ['messages', workspaceId, variables.messageId],
      });
      queryClient.invalidateQueries({
        queryKey: ['messages', 'stats', workspaceId],
      });
      queryClient.invalidateQueries({ queryKey: ['patients', workspaceId] });
      toast.success('Respuesta simulada exitosamente');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al simular la respuesta',
      );
    },
  });
}
