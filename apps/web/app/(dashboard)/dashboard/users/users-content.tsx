'use client';

import { Button } from '../../../../components/ui/button';
import { UserPlus } from 'lucide-react';
import { UsersList } from '../../../../components/users/users-list';
import { InviteUserDialog } from '../../../../components/users/invite-user-dialog';
import { PendingInvitations } from '../../../../components/users/pending-invitations';
import {
  useWorkspaceUsers,
  useRemoveUser,
  useUpdateUserRole,
} from '../../../../hooks/use-users';
import { useCurrentWorkspace } from '../../../../hooks/use-workspaces';
import { useState } from 'react';
import { Skeleton } from '../../../../components/ui/skeleton';

export default function UsersContent() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const { data: workspace, isLoading: loadingWorkspace } =
    useCurrentWorkspace();
  const { data: workspaceUsers, isLoading: loadingUsers } = useWorkspaceUsers(
    workspace?.id || '',
  );

  const removeUserMutation = useRemoveUser(workspace?.id || '');
  const updateRoleMutation = useUpdateUserRole(workspace?.id || '');

  const handleDeleteUser = (workspaceUserId: string) => {
    // Encontrar el userId real desde el workspaceUserId
    const workspaceUser = workspaceUsers?.find(
      (wu) => wu.id === workspaceUserId,
    );
    if (workspaceUser) {
      removeUserMutation.mutate(workspaceUser.userId);
    }
  };

  const handleRoleChange = (
    workspaceUserId: string,
    newRole: 'OWNER' | 'DOCTOR' | 'RECEPTIONIST',
  ) => {
    if (newRole === 'OWNER') return; // No se puede cambiar a OWNER
    // Encontrar el userId real desde el workspaceUserId
    const workspaceUser = workspaceUsers?.find(
      (wu) => wu.id === workspaceUserId,
    );
    if (workspaceUser) {
      updateRoleMutation.mutate({
        userId: workspaceUser.userId,
        role: newRole,
      });
    }
  };

  const handleInviteSuccess = () => {
    setInviteDialogOpen(false);
  };

  if (loadingWorkspace || loadingUsers) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Transformar WorkspaceUser[] a User[] para compatibilidad con componentes existentes
  const users =
    workspaceUsers?.map((wu) => {
      let formattedDate = 'N/A';
      try {
        if (wu.createdAt) {
          const date = new Date(wu.createdAt);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split('T')[0];
          }
        }
      } catch (error) {
        console.error('Error parsing date:', wu.createdAt, error);
      }

      return {
        id: wu.id, // Usar el ID del WorkspaceUser (único)
        userId: wu.userId, // Mantener userId para operaciones
        name: wu.user.name,
        email: wu.user.email,
        role: wu.role,
        createdAt: formattedDate,
      };
    }) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los usuarios de tu workspace
          </p>
        </div>

        <Button onClick={() => setInviteDialogOpen(true)} className="w-full sm:w-auto">
          <UserPlus className="mr-2 h-4 w-4" />
          Invitar Usuario
        </Button>
      </div>

      <UsersList
        users={users}
        onDelete={handleDeleteUser}
        onRoleChange={handleRoleChange}
      />

      <PendingInvitations />

      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={handleInviteSuccess}
        workspaceId={workspace?.id || ''}
      />
    </div>
  );
}
