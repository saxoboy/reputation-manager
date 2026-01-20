import { apiClient } from '../lib/api-client';

export interface MessageTemplate {
  id: string;
  workspaceId: string;
  type: 'INITIAL' | 'FOLLOWUP_HAPPY' | 'FOLLOWUP_UNHAPPY' | 'REMINDER';
  name: string;
  content: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateDto {
  type: 'INITIAL' | 'FOLLOWUP_HAPPY' | 'FOLLOWUP_UNHAPPY' | 'REMINDER';
  name: string;
  content: string;
  variables?: string[];
}

export interface UpdateTemplateDto {
  name?: string;
  content?: string;
}

export const templateService = {
  async getAll(workspaceId: string): Promise<MessageTemplate[]> {
    return apiClient.get<MessageTemplate[]>(
      `/workspaces/${workspaceId}/templates`,
    );
  },

  async getById(workspaceId: string, id: string): Promise<MessageTemplate> {
    return apiClient.get<MessageTemplate>(
      `/workspaces/${workspaceId}/templates/${id}`,
    );
  },

  async create(
    workspaceId: string,
    data: CreateTemplateDto,
  ): Promise<MessageTemplate> {
    return apiClient.post<MessageTemplate>(
      `/workspaces/${workspaceId}/templates`,
      data,
    );
  },

  async update(
    workspaceId: string,
    id: string,
    data: UpdateTemplateDto,
  ): Promise<MessageTemplate> {
    return apiClient.put<MessageTemplate>(
      `/workspaces/${workspaceId}/templates/${id}`,
      data,
    );
  },

  async delete(workspaceId: string, id: string): Promise<void> {
    return apiClient.delete<void>(`/workspaces/${workspaceId}/templates/${id}`);
  },

  async duplicate(workspaceId: string, id: string): Promise<MessageTemplate> {
    return apiClient.post<MessageTemplate>(
      `/workspaces/${workspaceId}/templates/${id}/duplicate`,
      {},
    );
  },
};
