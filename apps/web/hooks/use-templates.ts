import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  templateService,
  type CreateTemplateDto,
  type UpdateTemplateDto,
} from '../services/template.service';

export function useTemplates(workspaceId: string) {
  return useQuery({
    queryKey: ['templates', workspaceId],
    queryFn: () => templateService.getAll(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useTemplate(workspaceId: string, templateId: string) {
  return useQuery({
    queryKey: ['templates', workspaceId, templateId],
    queryFn: () => templateService.getById(workspaceId, templateId),
    enabled: !!workspaceId && !!templateId,
  });
}

export function useCreateTemplate(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTemplateDto) =>
      templateService.create(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', workspaceId] });
      toast.success('Plantilla creada exitosamente');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Error al crear la plantilla',
      );
    },
  });
}

export function useUpdateTemplate(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      data,
    }: {
      templateId: string;
      data: UpdateTemplateDto;
    }) => templateService.update(workspaceId, templateId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['templates', workspaceId] });
      queryClient.invalidateQueries({
        queryKey: ['templates', workspaceId, variables.templateId],
      });
      toast.success('Plantilla actualizada exitosamente');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al actualizar la plantilla',
      );
    },
  });
}

export function useDeleteTemplate(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) =>
      templateService.delete(workspaceId, templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', workspaceId] });
      toast.success('Plantilla eliminada exitosamente');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al eliminar la plantilla',
      );
    },
  });
}

export function useDuplicateTemplate(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) =>
      templateService.duplicate(workspaceId, templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', workspaceId] });
      toast.success('Plantilla duplicada exitosamente');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al duplicar la plantilla',
      );
    },
  });
}
