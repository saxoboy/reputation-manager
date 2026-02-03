import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@reputation-manager/database';
import { MessageStatus, MessageType } from '@prisma/client';

export interface WorkspaceAnalytics {
  overview: {
    totalMessages: number;
    totalResponses: number;
    responseRate: number;
    averageRating: number;
    npsScore: number;
  };
  distribution: {
    rating: { [key: string]: number };
    sentiment: {
      happy: number; // 4-5
      neutral: number; // 3
      unhappy: number; // 1-2
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
  campaignId: string;
  campaignName: string;
  totalPatients: number;
  messagesSent: number;
  totalResponses: number;
  responseRate: number;
  averageRating: number;
  npsScore: number;
  distribution: {
    rating: { [key: string]: number };
    sentiment: {
      happy: number;
      neutral: number;
      unhappy: number;
    };
  };
  patients: Array<{
    id: string;
    name: string;
    rating: number | null;
    responded: boolean;
    sentAt: Date | null;
    respondedAt: Date | null;
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
  overview: {
    totalMessages: number;
    totalResponses: number;
    responseRate: number;
    averageRating: number;
    npsScore: number;
  };
  distribution: {
    rating: { [key: string]: number };
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
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene analytics del workspace completo
   */
  async getWorkspaceAnalytics(
    workspaceId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<WorkspaceAnalytics> {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    // Total de mensajes enviados
    const totalMessages = await this.prisma.message.count({
      where: {
        patient: { campaign: { workspaceId } },
        status: MessageStatus.SENT,
        ...dateFilter,
      },
    });

    // Mensajes con respuesta
    const messagesWithResponse = await this.prisma.message.findMany({
      where: {
        patient: { campaign: { workspaceId } },
        rating: { not: null },
        ...dateFilter,
      },
      select: {
        rating: true,
        sentAt: true,
      },
    });

    const totalResponses = messagesWithResponse.length;
    const responseRate =
      totalMessages > 0 ? (totalResponses / totalMessages) * 100 : 0;

    // Promedio de rating
    const ratings = messagesWithResponse
      .map((m) => m.rating)
      .filter((r): r is number => r !== null);
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 0;

    // NPS Score
    const npsScore = this.calculateNPS(ratings);

    // Distribución de ratings
    const ratingDistribution = this.calculateRatingDistribution(ratings);

    // Sentimiento
    const sentiment = this.calculateSentiment(ratings);

    // Timeline (últimos 30 días)
    const timeline = await this.getTimeline(workspaceId, 30);

    // Top campaigns
    const campaigns = await this.getTopCampaigns(workspaceId, 5);

    return {
      overview: {
        totalMessages,
        totalResponses,
        responseRate: Math.round(responseRate * 10) / 10,
        averageRating: Math.round(averageRating * 10) / 10,
        npsScore,
      },
      distribution: {
        rating: ratingDistribution,
        sentiment,
      },
      timeline,
      campaigns,
    };
  }

  /**
   * Obtiene analytics de una campaña específica
   */
  async getCampaignAnalytics(
    workspaceId: string,
    campaignId: string,
  ): Promise<CampaignAnalytics> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId, workspaceId },
      include: {
        patients: {
          include: {
            messages: {
              where: { type: MessageType.INITIAL },
              orderBy: { sentAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const totalPatients = campaign.patients.length;

    // Contar mensajes enviados
    const messagesSent = campaign.patients.filter(
      (p) =>
        p.messages.length > 0 && p.messages[0].status === MessageStatus.SENT,
    ).length;

    // Contar respuestas
    const patientsWithResponse = campaign.patients.filter(
      (p) => p.messages.length > 0 && p.messages[0].rating !== null,
    );

    const totalResponses = patientsWithResponse.length;
    const responseRate =
      messagesSent > 0 ? (totalResponses / messagesSent) * 100 : 0;

    // Ratings
    const ratings = patientsWithResponse
      .map((p) => p.messages[0].rating)
      .filter((r): r is number => r !== null);

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 0;

    const npsScore = this.calculateNPS(ratings);
    const ratingDistribution = this.calculateRatingDistribution(ratings);
    const sentiment = this.calculateSentiment(ratings);

    // Pacientes con detalles
    const patients = campaign.patients.map((patient) => {
      const message = patient.messages[0];
      return {
        id: patient.id,
        name: patient.name,
        rating: message?.rating || null,
        responded: message?.rating !== null,
        sentAt: message?.sentAt || null,
        respondedAt: message?.repliedAt || null,
      };
    });

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      totalPatients,
      messagesSent,
      totalResponses,
      responseRate: Math.round(responseRate * 10) / 10,
      averageRating: Math.round(averageRating * 10) / 10,
      npsScore,
      distribution: {
        rating: ratingDistribution,
        sentiment,
      },
      patients,
    };
  }

  /**
   * Obtiene analytics de un practice específico
   */
  async getPracticeAnalytics(
    workspaceId: string,
    practiceId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PracticeAnalytics> {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const practice = await this.prisma.practice.findUnique({
      where: { id: practiceId, workspaceId },
    });

    if (!practice) {
      throw new Error('Practice not found');
    }

    // Campañas del practice
    const campaigns = await this.prisma.campaign.findMany({
      where: { practiceId, workspaceId, ...dateFilter },
      include: {
        patients: {
          include: {
            messages: {
              where: { type: MessageType.INITIAL },
            },
          },
        },
      },
    });

    const totalCampaigns = campaigns.length;

    // Contar mensajes y respuestas
    let messagesSent = 0;
    let totalResponses = 0;
    const allRatings: number[] = [];

    campaigns.forEach((campaign) => {
      campaign.patients.forEach((patient) => {
        const message = patient.messages.find(
          (m) => m.status === MessageStatus.SENT,
        );
        if (message) {
          messagesSent++;
          if (message.rating !== null) {
            totalResponses++;
            allRatings.push(message.rating);
          }
        }
      });
    });

    const responseRate =
      messagesSent > 0 ? (totalResponses / messagesSent) * 100 : 0;

    const averageRating =
      allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
        : 0;

    const npsScore = this.calculateNPS(allRatings);

    // Distribución y sentimiento
    const ratingDistribution = this.calculateRatingDistribution(allRatings);
    const sentiment = this.calculateSentiment(allRatings);

    // Timeline para este practice
    const timeline = await this.getTimelineForPractice(practiceId, 30);

    return {
      practiceId: practice.id,
      practiceName: practice.name,
      totalCampaigns,
      messagesSent,
      totalResponses,
      responseRate: Math.round(responseRate * 10) / 10,
      averageRating: Math.round(averageRating * 10) / 10,
      npsScore,
      timeline,
      // Agregar campos para compatibilidad con frontend
      overview: {
        totalMessages: messagesSent,
        totalResponses,
        responseRate: Math.round(responseRate * 10) / 10,
        averageRating: Math.round(averageRating * 10) / 10,
        npsScore,
      },
      distribution: {
        rating: ratingDistribution,
        sentiment,
      },
    };
  }

  /**
   * Calcula NPS Score
   * Promotores (9-10) = 5
   * Pasivos (7-8) = 3-4
   * Detractores (0-6) = 1-2
   *
   * NPS = % Promotores - % Detractores
   */
  private calculateNPS(ratings: number[]): number {
    if (ratings.length === 0) return 0;

    const promoters = ratings.filter((r) => r >= 5).length; // 5 estrellas
    const detractors = ratings.filter((r) => r <= 2).length; // 1-2 estrellas

    const promoterPercent = (promoters / ratings.length) * 100;
    const detractorPercent = (detractors / ratings.length) * 100;

    return Math.round(promoterPercent - detractorPercent);
  }

  /**
   * Calcula distribución de ratings
   */
  private calculateRatingDistribution(ratings: number[]): {
    [key: string]: number;
  } {
    const distribution: { [key: string]: number } = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    };

    ratings.forEach((rating) => {
      if (rating >= 1 && rating <= 5) {
        distribution[rating.toString()]++;
      }
    });

    return distribution;
  }

  /**
   * Calcula sentimiento (happy, neutral, unhappy)
   */
  private calculateSentiment(ratings: number[]): {
    happy: number;
    neutral: number;
    unhappy: number;
  } {
    return {
      happy: ratings.filter((r) => r >= 4).length,
      neutral: ratings.filter((r) => r === 3).length,
      unhappy: ratings.filter((r) => r <= 2).length,
    };
  }

  /**
   * Obtiene timeline de mensajes (últimos N días)
   */
  private async getTimeline(
    workspaceId: string,
    days: number,
  ): Promise<Array<{ date: string; sent: number; responses: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const messages = await this.prisma.message.findMany({
      where: {
        patient: { campaign: { workspaceId } },
        sentAt: { gte: startDate },
      },
      select: {
        sentAt: true,
        rating: true,
      },
    });

    // Agrupar por día
    const timelineMap = new Map<string, { sent: number; responses: number }>();

    messages.forEach((message) => {
      if (!message.sentAt) return;

      const dateKey = message.sentAt.toISOString().split('T')[0];
      const current = timelineMap.get(dateKey) || { sent: 0, responses: 0 };

      current.sent++;
      if (message.rating !== null) {
        current.responses++;
      }

      timelineMap.set(dateKey, current);
    });

    // Convertir a array y ordenar
    return Array.from(timelineMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Obtiene timeline para un practice específico
   */
  private async getTimelineForPractice(
    practiceId: string,
    days: number,
  ): Promise<Array<{ date: string; sent: number; responses: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const messages = await this.prisma.message.findMany({
      where: {
        patient: { campaign: { practiceId } },
        sentAt: { gte: startDate },
      },
      select: {
        sentAt: true,
        rating: true,
      },
    });

    const timelineMap = new Map<string, { sent: number; responses: number }>();

    messages.forEach((message) => {
      if (!message.sentAt) return;

      const dateKey = message.sentAt.toISOString().split('T')[0];
      const current = timelineMap.get(dateKey) || { sent: 0, responses: 0 };

      current.sent++;
      if (message.rating !== null) {
        current.responses++;
      }

      timelineMap.set(dateKey, current);
    });

    return Array.from(timelineMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Obtiene top campaigns del workspace
   */
  private async getTopCampaigns(
    workspaceId: string,
    limit: number,
  ): Promise<
    Array<{
      id: string;
      name: string;
      messagesSent: number;
      responses: number;
      responseRate: number;
      averageRating: number;
    }>
  > {
    const campaigns = await this.prisma.campaign.findMany({
      where: { workspaceId },
      include: {
        patients: {
          include: {
            messages: {
              where: { type: MessageType.INITIAL },
            },
          },
        },
      },
      take: limit * 2, // Traer más para filtrar después
    });

    const campaignStats = campaigns
      .map((campaign) => {
        let messagesSent = 0;
        let responses = 0;
        const ratings: number[] = [];

        campaign.patients.forEach((patient) => {
          const message = patient.messages.find(
            (m) => m.status === MessageStatus.SENT,
          );
          if (message) {
            messagesSent++;
            if (message.rating !== null) {
              responses++;
              ratings.push(message.rating);
            }
          }
        });

        const responseRate =
          messagesSent > 0 ? (responses / messagesSent) * 100 : 0;
        const averageRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
            : 0;

        return {
          id: campaign.id,
          name: campaign.name,
          messagesSent,
          responses,
          responseRate: Math.round(responseRate * 10) / 10,
          averageRating: Math.round(averageRating * 10) / 10,
        };
      })
      .filter((c) => c.messagesSent > 0) // Solo campañas con mensajes
      .sort((a, b) => b.responseRate - a.responseRate) // Ordenar por response rate
      .slice(0, limit);

    return campaignStats;
  }

  /**
   * Helper para construir filtro de fechas
   */
  private buildDateFilter(startDate?: Date, endDate?: Date) {
    const filter: {
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.gte = startDate;
      if (endDate) filter.createdAt.lte = endDate;
    }

    return filter;
  }
}
