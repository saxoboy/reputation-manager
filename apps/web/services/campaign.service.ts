import { apiClient } from '../lib/api-client';
import { authClient } from '../lib/auth-client';
import { getBaseUrl } from '../lib/get-base-url';

export interface ParsedPatientPreview {
  name: string;
  phone: string;
  email?: string;
  appointmentTime: string;
  appointmentType?: string;
  hasConsent: boolean;
}

export interface ParseExcelResult {
  patients: ParsedPatientPreview[];
  errors: {
    row: number;
    field: string;
    value: string;
    message: string;
  }[];
}

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
  ): Promise<{
    summary: { patientsCreated: number };
    duplicatesSkipped: number;
    errors?: { row: number; field: string; message: string }[];
  }> {
    return apiClient.post(
      `/workspaces/${workspaceId}/campaigns/${campaignId}/upload`,
      { csvContent },
    );
  },

  async downloadExcelTemplate(workspaceId: string): Promise<void> {
    const session = await authClient.getSession();
    const token = session?.data?.session?.token;
    const url = `${getBaseUrl()}/api/workspaces/${workspaceId}/campaigns/excel-template`;

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error('Error al descargar la plantilla');
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = 'plantilla-pacientes.xlsx';
    a.click();
    URL.revokeObjectURL(objectUrl);
  },

  async parseExcel(
    workspaceId: string,
    campaignId: string,
    base64Content: string,
  ): Promise<ParseExcelResult> {
    return apiClient.post<ParseExcelResult>(
      `/workspaces/${workspaceId}/campaigns/${campaignId}/parse-excel`,
      { fileContent: base64Content },
    );
  },
};
