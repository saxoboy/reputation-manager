import { apiClient } from '../lib/api-client';

export interface WorkspaceUser {
  id: string;
  userId: string;
  workspaceId: string;
  role: 'OWNER' | 'DOCTOR' | 'RECEPTIONIST';
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  createdAt: string;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: 'DOCTOR' | 'RECEPTIONIST';
  expiresAt: string;
  createdAt: string;
  invitedBy: string;
}

export interface InviteUserDto {
  email: string;
  role: 'DOCTOR' | 'RECEPTIONIST';
}

export const userService = {
  async getWorkspaceUsers(workspaceId: string): Promise<WorkspaceUser[]> {
    return apiClient.get<WorkspaceUser[]>(`/workspaces/${workspaceId}/users`);
  },

  async inviteUser(
    workspaceId: string,
    data: InviteUserDto,
  ): Promise<WorkspaceUser> {
    return apiClient.post<WorkspaceUser>(
      `/workspaces/${workspaceId}/users/invite`,
      data,
    );
  },

  async getPendingInvitations(
    workspaceId: string,
  ): Promise<PendingInvitation[]> {
    return apiClient.get<PendingInvitation[]>(
      `/workspaces/${workspaceId}/users/invitations`,
    );
  },

  async cancelInvitation(
    workspaceId: string,
    invitationId: string,
  ): Promise<void> {
    return apiClient.delete<void>(
      `/workspaces/${workspaceId}/users/invitations/${invitationId}`,
    );
  },

  async updateUserRole(
    workspaceId: string,
    userId: string,
    role: 'DOCTOR' | 'RECEPTIONIST',
  ): Promise<WorkspaceUser> {
    return apiClient.put<WorkspaceUser>(
      `/workspaces/${workspaceId}/users/${userId}/role`,
      { role },
    );
  },

  async removeUser(workspaceId: string, userId: string): Promise<void> {
    return apiClient.delete<void>(`/workspaces/${workspaceId}/users/${userId}`);
  },
};
