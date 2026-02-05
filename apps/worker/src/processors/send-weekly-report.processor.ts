import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@reputation-manager/database';
import { SendWeeklyReportJobData } from '@reputation-manager/shared-types';
import { SendGridService } from '@reputation-manager/integrations';

// TODO: Analytics and Export services need to be shared or moved to libs
// For now, we'll mock them or call the API endpoints

@Processor('weekly-reports', {
  concurrency: 1, // Procesar uno a la vez para no sobrecargar
})
export class SendWeeklyReportProcessor extends WorkerHost {
  private readonly logger = new Logger(SendWeeklyReportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: SendGridService,
  ) {
    super();
  }

  async process(
    job: Job<SendWeeklyReportJobData>,
  ): Promise<{ success: boolean; workspaceId: string; recipients: number }> {
    const { workspaceId, workspaceName, recipients } = job.data;

    this.logger.log(
      `📊 Procesando weekly report para workspace: ${workspaceName} (${workspaceId})`,
    );

    try {
      // 1. Calcular fechas (última semana)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      this.logger.log(
        `📅 Periodo: ${startDate.toISOString()} - ${endDate.toISOString()}`,
      );

      // 2. Obtener analytics directamente de la BD
      const analytics = await this.calculateAnalytics(
        workspaceId,
        startDate,
        endDate,
      );

      this.logger.log(
        `📈 Analytics obtenidos: ${analytics.totalMessages} mensajes`,
      );

      // 3. Enviar email a cada destinatario (sin PDF por ahora, solo HTML)
      const emailPromises = recipients.map((email) =>
        this.sendReportEmail(
          email,
          workspaceName,
          analytics,
          startDate,
          endDate,
        ),
      );

      await Promise.all(emailPromises);

      this.logger.log(
        `✅ Weekly report enviado a ${recipients.length} destinatarios`,
      );

      return {
        success: true,
        workspaceId,
        recipients: recipients.length,
      };
    } catch (error) {
      this.logger.error(
        `❌ Error procesando weekly report: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async calculateAnalytics(
    workspaceId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // Total de mensajes enviados
    const totalMessages = await this.prisma.message.count({
      where: {
        workspaceId,
        sentAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Total de respuestas
    const totalResponses = await this.prisma.message.count({
      where: {
        workspaceId,
        sentAt: {
          gte: startDate,
          lte: endDate,
        },
        rating: {
          not: null,
        },
      },
    });

    // Rating promedio
    const avgRating = await this.prisma.message.aggregate({
      where: {
        workspaceId,
        sentAt: {
          gte: startDate,
          lte: endDate,
        },
        rating: {
          not: null,
        },
      },
      _avg: {
        rating: true,
      },
    });

    // Distribución de sentimiento
    const happy = await this.prisma.message.count({
      where: {
        workspaceId,
        sentAt: { gte: startDate, lte: endDate },
        rating: { gte: 4 },
      },
    });

    const neutral = await this.prisma.message.count({
      where: {
        workspaceId,
        sentAt: { gte: startDate, lte: endDate },
        rating: { equals: 3 },
      },
    });

    const unhappy = await this.prisma.message.count({
      where: {
        workspaceId,
        sentAt: { gte: startDate, lte: endDate },
        rating: { lte: 2, gt: 0 },
      },
    });

    // Calcular NPS
    const promoters = await this.prisma.message.count({
      where: {
        workspaceId,
        sentAt: { gte: startDate, lte: endDate },
        rating: { gte: 5 },
      },
    });

    const detractors = await this.prisma.message.count({
      where: {
        workspaceId,
        sentAt: { gte: startDate, lte: endDate },
        rating: { lte: 2, gt: 0 },
      },
    });

    const npsScore =
      totalResponses > 0
        ? Math.round(((promoters - detractors) / totalResponses) * 100)
        : 0;

    const responseRate =
      totalMessages > 0 ? (totalResponses / totalMessages) * 100 : 0;

    return {
      totalMessages,
      totalResponses,
      responseRate,
      averageRating: avgRating._avg.rating || 0,
      npsScore,
      sentiment: {
        happy,
        neutral,
        unhappy,
      },
    };
  }

  private async sendReportEmail(
    recipientEmail: string,
    workspaceName: string,
    analytics: Awaited<ReturnType<typeof this.calculateAnalytics>>,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    this.logger.log(`📧 Enviando email a: ${recipientEmail}`);

    const formatDate = (date: Date) =>
      date.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    const emailContent = {
      to: recipientEmail,
      subject: `📊 Reporte Semanal - ${workspaceName} | ${formatDate(startDate)} - ${formatDate(endDate)}`,
      html: this.buildEmailHtml(workspaceName, analytics, startDate, endDate),
    };

    await this.emailService.sendEmail(emailContent);
    this.logger.log(`✅ Email enviado a: ${recipientEmail}`);
  }

  private buildEmailHtml(
    workspaceName: string,
    analytics: Awaited<ReturnType<typeof this.calculateAnalytics>>,
    startDate: Date,
    endDate: Date,
  ): string {
    const formatDate = (date: Date) =>
      date.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    const total =
      analytics.sentiment.happy +
      analytics.sentiment.neutral +
      analytics.sentiment.unhappy;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte Semanal - ${workspaceName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      color: #1e40af;
      font-size: 24px;
    }
    .header p {
      margin: 10px 0 0 0;
      color: #6b7280;
      font-size: 14px;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    .metric-card {
      background-color: #f9fafb;
      border-radius: 6px;
      padding: 15px;
      border-left: 4px solid #3b82f6;
    }
    .metric-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .metric-value {
      font-size: 28px;
      font-weight: bold;
      color: #1f2937;
    }
    .metric-unit {
      font-size: 14px;
      color: #6b7280;
      margin-left: 5px;
    }
    .sentiment-section {
      margin: 30px 0;
    }
    .sentiment-bar {
      display: flex;
      height: 40px;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 15px;
    }
    .sentiment-segment {
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
    }
    .sentiment-happy {
      background-color: #10b981;
    }
    .sentiment-neutral {
      background-color: #f59e0b;
    }
    .sentiment-unhappy {
      background-color: #ef4444;
    }
    .sentiment-legend {
      display: flex;
      justify-content: space-around;
      font-size: 13px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .cta-button {
      display: inline-block;
      background-color: #3b82f6;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Reporte Semanal</h1>
      <p><strong>${workspaceName}</strong></p>
      <p>${formatDate(startDate)} - ${formatDate(endDate)}</p>
    </div>

    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-label">Mensajes Enviados</div>
        <div class="metric-value">${analytics.totalMessages || 0}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Tasa de Respuesta</div>
        <div class="metric-value">
          ${analytics.responseRate?.toFixed(1) || '0.0'}
          <span class="metric-unit">%</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Rating Promedio</div>
        <div class="metric-value">
          ${analytics.averageRating?.toFixed(2) || '0.00'}
          <span class="metric-unit">/ 5.0</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-label">NPS Score</div>
        <div class="metric-value">${analytics.npsScore || 0}</div>
      </div>
    </div>

    <div class="sentiment-section">
      <h3 style="color: #1f2937; margin-bottom: 15px;">Análisis de Sentimiento</h3>
      <div class="sentiment-bar">
        ${
          total > 0
            ? `
          <div class="sentiment-segment sentiment-happy" style="width: ${((analytics.sentiment.happy / total) * 100).toFixed(1)}%">
            ${((analytics.sentiment.happy / total) * 100).toFixed(0)}%
          </div>
          <div class="sentiment-segment sentiment-neutral" style="width: ${((analytics.sentiment.neutral / total) * 100).toFixed(1)}%">
            ${((analytics.sentiment.neutral / total) * 100).toFixed(0)}%
          </div>
          <div class="sentiment-segment sentiment-unhappy" style="width: ${((analytics.sentiment.unhappy / total) * 100).toFixed(1)}%">
            ${((analytics.sentiment.unhappy / total) * 100).toFixed(0)}%
          </div>
        `
            : '<div style="width: 100%; text-align: center; padding: 10px; color: #6b7280;">Sin datos</div>'
        }
      </div>
      <div class="sentiment-legend">
        <div class="legend-item">
          <div class="legend-dot sentiment-happy"></div>
          <span>Felices (4-5): ${analytics.sentiment.happy}</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot sentiment-neutral"></div>
          <span>Neutrales (3): ${analytics.sentiment.neutral}</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot sentiment-unhappy"></div>
          <span>Infelices (1-2): ${analytics.sentiment.unhappy}</span>
        </div>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'}/dashboard/analytics" class="cta-button">
        Ver Dashboard Completo →
      </a>
    </div>

    <div class="footer">
      <p><strong>Reputation Manager</strong> - Sistema de Gestión de Feedback</p>
      <p>Este reporte incluye el PDF adjunto con información detallada.</p>
      <p style="margin-top: 10px;">
        <a href="#" style="color: #6b7280; text-decoration: none;">Configurar reportes</a> |
        <a href="#" style="color: #6b7280; text-decoration: none;">Cancelar suscripción</a>
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}
