import { apiClient } from '../lib/api-client';

export interface Workspace {
  id: string;
  name: string;
  plan: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  messageCredits: number;
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

  async getCurrent(): Promise<Workspace> {
    return apiClient.get<Workspace>('/workspaces/current');
  },
};
