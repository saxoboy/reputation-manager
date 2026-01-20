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

class PatientService {
  private baseUrl = '/api';

  async getAll(
    workspaceId: string,
    filters?: {
      campaignId?: string;
      hasConsent?: boolean;
      optedOut?: boolean;
    },
  ): Promise<Patient[]> {
    const params = new URLSearchParams();
    if (filters?.campaignId) params.append('campaignId', filters.campaignId);
    if (filters?.hasConsent !== undefined)
      params.append('hasConsent', String(filters.hasConsent));
    if (filters?.optedOut !== undefined)
      params.append('optedOut', String(filters.optedOut));

    const queryString = params.toString();
    const url = `${this.baseUrl}/workspaces/${workspaceId}/patients${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener pacientes');
    }

    return response.json();
  }

  async getByCampaign(
    workspaceId: string,
    campaignId: string,
  ): Promise<Patient[]> {
    const response = await fetch(
      `${this.baseUrl}/workspaces/${workspaceId}/campaigns/${campaignId}/patients`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error('Error al obtener pacientes de la campaña');
    }

    return response.json();
  }

  async getById(workspaceId: string, patientId: string): Promise<Patient> {
    const response = await fetch(
      `${this.baseUrl}/workspaces/${workspaceId}/patients/${patientId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error('Error al obtener paciente');
    }

    return response.json();
  }

  async getStats(workspaceId: string): Promise<PatientStats> {
    const response = await fetch(
      `${this.baseUrl}/workspaces/${workspaceId}/patients/stats`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error('Error al obtener estadísticas de pacientes');
    }

    return response.json();
  }

  async create(workspaceId: string, data: CreatePatientDto): Promise<Patient> {
    const response = await fetch(
      `${this.baseUrl}/workspaces/${workspaceId}/patients`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear paciente');
    }

    return response.json();
  }

  async update(
    workspaceId: string,
    patientId: string,
    data: UpdatePatientDto,
  ): Promise<Patient> {
    const response = await fetch(
      `${this.baseUrl}/workspaces/${workspaceId}/patients/${patientId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar paciente');
    }

    return response.json();
  }

  async delete(workspaceId: string, patientId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/workspaces/${workspaceId}/patients/${patientId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar paciente');
    }
  }

  async optOut(workspaceId: string, patientId: string): Promise<Patient> {
    const response = await fetch(
      `${this.baseUrl}/workspaces/${workspaceId}/patients/${patientId}/opt-out`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al marcar opt-out');
    }

    return response.json();
  }
}

export const patientService = new PatientService();
