import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, type InviteUserDto } from '../services/user.service';
import { toast } from 'sonner';

export function useWorkspaceUsers(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-users', workspaceId],
    queryFn: () => userService.getWorkspaceUsers(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useInviteUser(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteUserDto) =>
      userService.inviteUser(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-users', workspaceId],
      });
      toast.success('Invitación enviada', {
        description: 'El usuario ha sido invitado al workspace.',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al invitar usuario', {
        description: error.message,
      });
    },
  });
}

export function useUpdateUserRole(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: 'DOCTOR' | 'RECEPTIONIST';
    }) => userService.updateUserRole(workspaceId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-users', workspaceId],
      });
      toast.success('Rol actualizado', {
        description: 'Los permisos del usuario han sido modificados.',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar rol', {
        description: error.message,
      });
    },
  });
}

export function useRemoveUser(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => userService.removeUser(workspaceId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-users', workspaceId],
      });
      toast.success('Usuario eliminado', {
        description: 'El usuario ha sido removido del workspace.',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar usuario', {
        description: error.message,
      });
    },
  });
}
