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

export interface InviteUserDto {
  email: string;
  name: string;
  role: 'DOCTOR' | 'RECEPTIONIST';
}

export const userService = {
  async getWorkspaceUsers(workspaceId: string): Promise<WorkspaceUser[]> {
    return apiClient.get<WorkspaceUser[]>(
      `/workspace-users/${workspaceId}/users`,
    );
  },

  async inviteUser(
    workspaceId: string,
    data: InviteUserDto,
  ): Promise<WorkspaceUser> {
    return apiClient.post<WorkspaceUser>(
      `/workspace-users/${workspaceId}/invite`,
      data,
    );
  },

  async updateUserRole(
    workspaceId: string,
    userId: string,
    role: 'DOCTOR' | 'RECEPTIONIST',
  ): Promise<WorkspaceUser> {
    return apiClient.put<WorkspaceUser>(
      `/workspace-users/${workspaceId}/users/${userId}/role`,
      { role },
    );
  },

  async removeUser(workspaceId: string, userId: string): Promise<void> {
    return apiClient.delete<void>(
      `/workspace-users/${workspaceId}/users/${userId}`,
    );
  },
};
