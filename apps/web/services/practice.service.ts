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
    return apiClient.get<Practice[]>(`/practices/${workspaceId}`);
  },

  async getById(workspaceId: string, id: string): Promise<Practice> {
    return apiClient.get<Practice>(`/practices/${workspaceId}/${id}`);
  },

  async create(
    workspaceId: string,
    data: CreatePracticeDto,
  ): Promise<Practice> {
    return apiClient.post<Practice>(`/practices/${workspaceId}`, data);
  },

  async update(
    workspaceId: string,
    id: string,
    data: UpdatePracticeDto,
  ): Promise<Practice> {
    return apiClient.put<Practice>(`/practices/${workspaceId}/${id}`, data);
  },

  async delete(workspaceId: string, id: string): Promise<void> {
    return apiClient.delete<void>(`/practices/${workspaceId}/${id}`);
  },
};
