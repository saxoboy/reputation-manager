import { apiClient } from '../lib/api-client';

export interface Practice {
  id: string;
  workspaceId: string;
  name: string;
  googlePlaceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePracticeDto {
  name: string;
  googlePlaceId?: string;
}

export interface UpdatePracticeDto {
  name?: string;
  googlePlaceId?: string;
}

export const practiceService = {
  async getAll(workspaceId: string): Promise<Practice[]> {
    return apiClient.get<Practice[]>(`/workspaces/${workspaceId}/practices`);
  },

  async getById(workspaceId: string, id: string): Promise<Practice> {
    return apiClient.get<Practice>(
      `/workspaces/${workspaceId}/practices/${id}`,
    );
  },

  async create(
    workspaceId: string,
    data: CreatePracticeDto,
  ): Promise<Practice> {
    return apiClient.post<Practice>(
      `/workspaces/${workspaceId}/practices`,
      data,
    );
  },

  async update(
    workspaceId: string,
    id: string,
    data: UpdatePracticeDto,
  ): Promise<Practice> {
    return apiClient.put<Practice>(
      `/workspaces/${workspaceId}/practices/${id}`,
      data,
    );
  },

  async delete(workspaceId: string, id: string): Promise<void> {
    return apiClient.delete<void>(`/workspaces/${workspaceId}/practices/${id}`);
  },
};
