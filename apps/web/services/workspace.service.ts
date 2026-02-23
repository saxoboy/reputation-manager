import { apiClient } from '../lib/api-client';

export interface Workspace {
  id: string;
  name: string;
  plan: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  messageCredits: number;
  defaultChannel: 'SMS' | 'WHATSAPP' | 'EMAIL';
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  emailEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceDto {
  name: string;
  plan?: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
}

export interface UpdateWorkspaceDto {
  name?: string;
  plan?: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
}

export interface UpdateWorkspaceChannelSettingsDto {
  defaultChannel?: 'SMS' | 'WHATSAPP' | 'EMAIL';
  smsEnabled?: boolean;
  whatsappEnabled?: boolean;
  emailEnabled?: boolean;
}

export const workspaceService = {
  async getAll(): Promise<Workspace[]> {
    return apiClient.get<Workspace[]>('/workspaces');
  },

  async getById(id: string): Promise<Workspace> {
    return apiClient.get<Workspace>(`/workspaces/${id}`);
  },

  async create(data: CreateWorkspaceDto): Promise<Workspace> {
    return apiClient.post<Workspace>('/workspaces', data);
  },

  async update(id: string, data: UpdateWorkspaceDto): Promise<Workspace> {
    return apiClient.put<Workspace>(`/workspaces/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/workspaces/${id}`);
  },

  async updateChannelSettings(
    id: string,
    data: UpdateWorkspaceChannelSettingsDto,
  ): Promise<Workspace> {
    return apiClient.patch<Workspace>(
      `/workspaces/${id}/channel-settings`,
      data,
    );
  },

  async getCurrent(): Promise<Workspace> {
    return apiClient.get<Workspace>('/workspaces/current');
  },
};
