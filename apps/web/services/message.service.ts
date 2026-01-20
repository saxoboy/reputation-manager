import {
  MessageType,
  MessageStatus,
  MessageChannel,
} from '../types/mock-types';

export interface Message {
  id: string;
  type: MessageType;
  channel: MessageChannel;
  content: string;
  status: MessageStatus;
  rating?: number;
  feedback?: string;
  sentAt?: string;
  deliveredAt?: string;
  respondedAt?: string;
  patientId: string;
  campaignId: string;
  workspaceId: string;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  campaign?: {
    id: string;
    name: string;
  };
  template?: {
    id: string;
    name: string;
    type: MessageType;
  };
}

export interface CreateMessageDto {
  patientId: string;
  type: MessageType;
  channel: MessageChannel;
  content: string;
  templateId?: string;
}

export interface UpdateMessageDto {
  type?: MessageType;
  channel?: MessageChannel;
  content?: string;
  status?: MessageStatus;
  rating?: number;
  templateId?: string;
  sentAt?: string;
  deliveredAt?: string;
  respondedAt?: string;
}

export interface SimulateResponseDto {
  rating: number;
  feedback?: string;
}

export interface MessageStats {
  total: number;
  byStatus: {
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
  };
  responses: {
    total: number;
    averageRating: number;
    happy: number;
    unhappy: number;
    responseRate: number;
  };
}

class MessageService {
  private baseUrl = '/api';

  async getAll(
    workspaceId: string,
    filters?: {
      campaignId?: string;
      patientId?: string;
      status?: MessageStatus;
      type?: MessageType;
    },
  ): Promise<Message[]> {
    const params = new URLSearchParams();
    if (filters?.campaignId) params.append('campaignId', filters.campaignId);
    if (filters?.patientId) params.append('patientId', filters.patientId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);

    const queryString = params.toString();
    const url = `${this.baseUrl}/workspaces/${workspaceId}/messages${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener mensajes');
    }

    return response.json();
  }

  async getByCampaign(
    workspaceId: string,
    campaignId: string,
  ): Promise<Message[]> {
    const response = await fetch(
      `${this.baseUrl}/workspaces/${workspaceId}/campaigns/${campaignId}/messages`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error('Error al obtener mensajes de la campaña');
    }

    return response.json();
  }

  async getByPatient(
    workspaceId: string,
    patientId: string,
  ): Promise<Message[]> {
    const response = await fetch(
      `${this.baseUrl}/workspaces/${workspaceId}/patients/${patientId}/messages`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error('Error al obtener mensajes del paciente');
    }

    return response.json();
  }

  async getById(workspaceId: string, messageId: string): Promise<Message> {
    const response = await fetch(
      `${this.baseUrl}/workspaces/${workspaceId}/messages/${messageId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error('Error al obtener mensaje');
    }

    return response.json();
  }

  async getStats(workspaceId: string): Promise<MessageStats> {
    const response = await fetch(
      `${this.baseUrl}/workspaces/${workspaceId}/messages/stats`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error('Error al obtener estadísticas de mensajes');
    }

    return response.json();
  }

  async create(workspaceId: string, data: CreateMessageDto): Promise<Message> {
    const response = await fetch(
      `${this.baseUrl}/workspaces/${workspaceId}/messages`,
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
      throw new Error(error.message || 'Error al crear mensaje');
    }

    return response.json();
  }

  async update(
    workspaceId: string,
    messageId: string,
    data: UpdateMessageDto,
  ): Promise<Message> {
    const response = await fetch(
      `${this.baseUrl}/workspaces/${workspaceId}/messages/${messageId}`,
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
      throw new Error(error.message || 'Error al actualizar mensaje');
    }

    return response.json();
  }

  async delete(workspaceId: string, messageId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/workspaces/${workspaceId}/messages/${messageId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar mensaje');
    }
  }

  async simulateResponse(
    workspaceId: string,
    messageId: string,
    data: SimulateResponseDto,
  ): Promise<Message> {
    const response = await fetch(
      `${this.baseUrl}/workspaces/${workspaceId}/messages/${messageId}/response`,
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
      throw new Error(error.message || 'Error al simular respuesta');
    }

    return response.json();
  }
}

export const messageService = new MessageService();
