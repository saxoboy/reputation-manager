import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  practiceService,
  type CreatePracticeDto,
  type UpdatePracticeDto,
} from '../services/practice.service';
import { toast } from 'sonner';

export function usePractices(workspaceId: string) {
  return useQuery({
    queryKey: ['practices', workspaceId],
    queryFn: () => practiceService.getAll(workspaceId),
    enabled: !!workspaceId,
  });
}

export function usePractice(workspaceId: string, id: string) {
  return useQuery({
    queryKey: ['practice', workspaceId, id],
    queryFn: () => practiceService.getById(workspaceId, id),
    enabled: !!workspaceId && !!id,
  });
}

export function useCreatePractice(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePracticeDto) =>
      practiceService.create(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practices', workspaceId] });
      toast.success('Consultorio creado', {
        description: 'El consultorio ha sido agregado exitosamente.',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al crear consultorio', {
        description: error.message,
      });
    },
  });
}

export function useUpdatePractice(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePracticeDto }) =>
      practiceService.update(workspaceId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practices', workspaceId] });
      toast.success('Consultorio actualizado', {
        description: 'Los cambios han sido guardados.',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar consultorio', {
        description: error.message,
      });
    },
  });
}

export function useDeletePractice(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => practiceService.delete(workspaceId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practices', workspaceId] });
      toast.success('Consultorio eliminado', {
        description: 'El consultorio ha sido eliminado permanentemente.',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar consultorio', {
        description: error.message,
      });
    },
  });
}
