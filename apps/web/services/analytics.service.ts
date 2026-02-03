import { apiClient } from '../lib/api-client';

export interface WorkspaceAnalytics {
  overview: {
    totalMessages: number;
    totalResponses: number;
    responseRate: number;
    averageRating: number;
    npsScore: number;
  };
  distribution: {
    rating: Record<string, number>;
    sentiment: {
      happy: number;
      neutral: number;
      unhappy: number;
    };
  };
  timeline: Array<{
    date: string;
    sent: number;
    responses: number;
  }>;
  campaigns: Array<{
    id: string;
    name: string;
    messagesSent: number;
    responses: number;
    responseRate: number;
    averageRating: number;
  }>;
}

export interface CampaignAnalytics {
  campaign: {
    id: string;
    name: string;
    createdAt: string;
    status: string;
  };
  overview: {
    totalPatients: number;
    totalMessages: number;
    totalResponses: number;
    responseRate: number;
    averageRating: number;
    npsScore: number;
  };
  distribution: Record<number, number>;
  sentiment: {
    happy: number;
    neutral: number;
    unhappy: number;
  };
  patients: Array<{
    id: string;
    name: string;
    phone: string;
    rating: number | null;
    hasResponded: boolean;
    sentAt: string;
    respondedAt: string | null;
  }>;
}

export interface PracticeAnalytics {
  practiceId: string;
  practiceName: string;
  totalCampaigns: number;
  messagesSent: number;
  totalResponses: number;
  responseRate: number;
  averageRating: number;
  npsScore: number;
  timeline: Array<{
    date: string;
    sent: number;
    responses: number;
  }>;
  // Agregamos estos campos para compatibilidad con la vista
  overview: {
    totalMessages: number;
    totalResponses: number;
    responseRate: number;
    averageRating: number;
    npsScore: number;
  };
  distribution: {
    rating: Record<string, number>;
    sentiment: {
      happy: number;
      neutral: number;
      unhappy: number;
    };
  };
}

export const analyticsService = {
  /**
   * Obtiene analytics general del workspace
   */
  getWorkspaceAnalytics: async (
    workspaceId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<WorkspaceAnalytics> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const queryString = params.toString();
    const url = `/workspaces/${workspaceId}/analytics${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<WorkspaceAnalytics>(url);
  },

  /**
   * Obtiene analytics de una campaña específica
   */
  getCampaignAnalytics: async (
    workspaceId: string,
    campaignId: string,
  ): Promise<CampaignAnalytics> => {
    return apiClient.get<CampaignAnalytics>(
      `/workspaces/${workspaceId}/analytics/campaigns/${campaignId}`,
    );
  },

  /**
   * Obtiene analytics de un practice específico
   */
  getPracticeAnalytics: async (
    workspaceId: string,
    practiceId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PracticeAnalytics> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const queryString = params.toString();
    const url = `/workspaces/${workspaceId}/analytics/practices/${practiceId}${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<PracticeAnalytics>(url);
  },
};
