import { apiClient } from '../lib/api-client';
import { MessageChannel } from '../types/mock-types';

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  appointmentTime: string;
  appointmentType?: string;
  hasConsent: boolean;
  optedOutAt?: string;
  dataDeletedAt?: string;
  preferredChannel: MessageChannel;
  language: string;
  campaignId: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  campaign?: {
    id: string;
    name: string;
  };
  messages?: Array<{
    id: string;
    type: string;
    status: string;
    rating?: number;
    createdAt: string;
  }>;
}

export interface CreatePatientDto {
  name: string;
  phone: string;
  email?: string;
  appointmentTime: string;
  appointmentType?: string;
  hasConsent: boolean;
  preferredChannel?: MessageChannel;
  language?: string;
  campaignId: string;
}

export interface UpdatePatientDto {
  name?: string;
  phone?: string;
  email?: string;
  appointmentTime?: string;
  appointmentType?: string;
  hasConsent?: boolean;
  preferredChannel?: MessageChannel;
  language?: string;
  campaignId?: string;
  optedOutAt?: string;
  dataDeletedAt?: string;
}

export interface PatientStats {
  total: number;
  withConsent: number;
  withoutConsent: number;
  optedOut: number;
  deleted: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class PatientService {
  async getAll(
    workspaceId: string,
    filters?: {
      campaignId?: string;
      hasConsent?: boolean;
      optedOut?: boolean;
    },
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<Patient>> {
    const params = new URLSearchParams();
    if (filters?.campaignId) params.append('campaignId', filters.campaignId);
    if (filters?.hasConsent !== undefined)
      params.append('hasConsent', String(filters.hasConsent));
    if (filters?.optedOut !== undefined)
      params.append('optedOut', String(filters.optedOut));
    params.append('page', String(page));
    params.append('limit', String(limit));

    const endpoint = `/workspaces/${workspaceId}/patients?${params.toString()}`;
    return apiClient.get<PaginatedResponse<Patient>>(endpoint);
  }

  async getByCampaign(
    workspaceId: string,
    campaignId: string,
  ): Promise<Patient[]> {
    return apiClient.get<Patient[]>(
      `/workspaces/${workspaceId}/campaigns/${campaignId}/patients`,
    );
  }

  async getById(workspaceId: string, patientId: string): Promise<Patient> {
    return apiClient.get<Patient>(
      `/workspaces/${workspaceId}/patients/${patientId}`,
    );
  }

  async getStats(workspaceId: string): Promise<PatientStats> {
    return apiClient.get<PatientStats>(
      `/workspaces/${workspaceId}/patients/stats`,
    );
  }

  async create(workspaceId: string, data: CreatePatientDto): Promise<Patient> {
    return apiClient.post<Patient>(`/workspaces/${workspaceId}/patients`, data);
  }

  async update(
    workspaceId: string,
    patientId: string,
    data: UpdatePatientDto,
  ): Promise<Patient> {
    return apiClient.put<Patient>(
      `/workspaces/${workspaceId}/patients/${patientId}`,
      data,
    );
  }

  async delete(workspaceId: string, patientId: string): Promise<void> {
    return apiClient.delete<void>(
      `/workspaces/${workspaceId}/patients/${patientId}`,
    );
  }

  async optOut(workspaceId: string, patientId: string): Promise<Patient> {
    return apiClient.post<Patient>(
      `/workspaces/${workspaceId}/patients/${patientId}/opt-out`,
    );
  }
}

export const patientService = new PatientService();
