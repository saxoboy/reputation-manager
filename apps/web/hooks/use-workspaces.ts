import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  workspaceService,
  type CreateWorkspaceDto,
  type UpdateWorkspaceDto,
} from '../services/workspace.service';
import { toast } from 'sonner';

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspaceService.getAll(),
  });
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: ['workspace', id],
    queryFn: () => workspaceService.getById(id),
    enabled: !!id,
  });
}

export function useCurrentWorkspace() {
  return useQuery({
    queryKey: ['workspace', 'current'],
    queryFn: () => workspaceService.getCurrent(),
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkspaceDto) => workspaceService.create(data),
    onSuccess: (newWorkspace) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace creado', {
        description: `${newWorkspace.name} ha sido creado exitosamente.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Error al crear workspace', {
        description: error.message,
      });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkspaceDto }) =>
      workspaceService.update(id, data),
    onSuccess: (updatedWorkspace) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({
        queryKey: ['workspace', updatedWorkspace.id],
      });
      toast.success('Workspace actualizado', {
        description: 'Los cambios han sido guardados.',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar workspace', {
        description: error.message,
      });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workspaceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace eliminado', {
        description: 'El workspace ha sido eliminado permanentemente.',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar workspace', {
        description: error.message,
      });
    },
  });
}
