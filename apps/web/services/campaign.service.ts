import { apiClient } from '../lib/api-client';

export interface Campaign {
  id: string;
  workspaceId: string;
  practiceId: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
  scheduledHoursAfter: number;
  createdAt: string;
  updatedAt: string;
  practice?: {
    id: string;
    name: string;
  };
  _count?: {
    patients: number;
    messages: number;
  };
}

export interface CreateCampaignDto {
  practiceId: string;
  name: string;
  description?: string;
  scheduledHoursAfter?: number;
  patients: {
    name: string;
    phone: string;
    email?: string;
    appointmentTime: string;
    hasConsent: boolean;
  }[];
}

export interface UpdateCampaignDto {
  name?: string;
  description?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
}

export const campaignService = {
  async getAll(workspaceId: string): Promise<Campaign[]> {
    return apiClient.get<Campaign[]>(`/workspaces/${workspaceId}/campaigns`);
  },

  async getById(workspaceId: string, id: string): Promise<Campaign> {
    return apiClient.get<Campaign>(
      `/workspaces/${workspaceId}/campaigns/${id}`,
    );
  },

  async create(
    workspaceId: string,
    data: CreateCampaignDto,
  ): Promise<Campaign> {
    return apiClient.post<Campaign>(
      `/workspaces/${workspaceId}/campaigns`,
      data,
    );
  },

  async update(
    workspaceId: string,
    id: string,
    data: UpdateCampaignDto,
  ): Promise<Campaign> {
    return apiClient.put<Campaign>(
      `/workspaces/${workspaceId}/campaigns/${id}`,
      data,
    );
  },

  async delete(workspaceId: string, id: string): Promise<void> {
    return apiClient.delete<void>(`/workspaces/${workspaceId}/campaigns/${id}`);
  },

  async uploadCsv(
    workspaceId: string,
    campaignId: string,
    csvContent: string,
  ): Promise<{ imported: number; errors: string[] }> {
    return apiClient.post<{ imported: number; errors: string[] }>(
      `/workspaces/${workspaceId}/campaigns/${campaignId}/upload`,
      { csvContent },
    );
  },
};
