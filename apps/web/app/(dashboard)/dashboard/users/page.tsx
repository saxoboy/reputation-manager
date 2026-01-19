'use client';

import { Button } from '../../../../components/ui/button';
import { UserPlus } from 'lucide-react';
import { UsersList } from '../../../../components/users/users-list';
import { InviteUserDialog } from '../../../../components/users/invite-user-dialog';
import { PendingInvitations } from '../../../../components/users/pending-invitations';
import { useWorkspaceUsers, useRemoveUser, useUpdateUserRole } from '../../../../hooks/use-users';
import { useCurrentWorkspace } from '../../../../hooks/use-workspaces';
import { useState } from 'react';
import { Skeleton } from '../../../../components/ui/skeleton';

export default function UsersPage() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const { data: workspace, isLoading: loadingWorkspace } = useCurrentWorkspace();
  const { data: workspaceUsers, isLoading: loadingUsers } = useWorkspaceUsers(
    workspace?.id || ''
  );

  const removeUserMutation = useRemoveUser(workspace?.id || '');
  const updateRoleMutation = useUpdateUserRole(workspace?.id || '');

  const handleDeleteUser = (id: string) => {
    removeUserMutation.mutate(id);
  };

  const handleRoleChange = (id: string, newRole: 'OWNER' | 'DOCTOR' | 'RECEPTIONIST') => {
    if (newRole === 'OWNER') return; // No se puede cambiar a OWNER
    updateRoleMutation.mutate({ userId: id, role: newRole });
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
  const users = workspaceUsers?.map(wu => ({
    id: wu.userId,
    name: wu.user.name,
    email: wu.user.email,
    role: wu.role,
    createdAt: new Date(wu.createdAt).toISOString().split('T')[0],
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios de tu workspace
          </p>
        </div>

        <Button onClick={() => setInviteDialogOpen(true)}>
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
