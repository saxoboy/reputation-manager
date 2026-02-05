import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService, ReportDay } from '@reputation-manager/database';
import { SendWeeklyReportJobData } from '@reputation-manager/shared-types';

@Injectable()
export class WeeklyReportScheduler {
  private readonly logger = new Logger(WeeklyReportScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('weekly-reports')
    private readonly weeklyReportsQueue: Queue<SendWeeklyReportJobData>,
  ) {}

  /**
   * Se ejecuta todos los lunes a las 9:00 AM
   * Revisa qué workspaces tienen habilitado el reporte semanal
   * y encola los jobs correspondientes
   */
  @Cron(CronExpression.EVERY_WEEK, {
    name: 'send-weekly-reports',
    timeZone: 'America/Guayaquil', // Ecuador timezone
  })
  async scheduleWeeklyReports() {
    this.logger.log('🕐 Iniciando scheduler de reportes semanales...');

    try {
      // Obtener día actual
      const today = new Date();
      const dayOfWeek = this.getDayOfWeekString(today);

      this.logger.log(`📅 Día actual: ${dayOfWeek}`);

      // Buscar workspaces que tengan reportes habilitados para este día
      const configs = await this.prisma.weeklyReportConfig.findMany({
        where: {
          enabled: true,
          dayOfWeek,
        },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      this.logger.log(
        `📊 Encontrados ${configs.length} workspaces para envío de reportes`,
      );

      // Encolar un job por cada workspace
      for (const config of configs) {
        if (!config.recipients || config.recipients.length === 0) {
          this.logger.warn(
            `⚠️  Workspace ${config.workspace.name} no tiene destinatarios configurados`,
          );
          continue;
        }

        await this.weeklyReportsQueue.add(
          'send-weekly-report',
          {
            workspaceId: config.workspaceId,
            workspaceName: config.workspace.name,
            recipients: config.recipients,
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
          },
        );

        this.logger.log(
          `✅ Job encolado para workspace: ${config.workspace.name}`,
        );

        // Actualizar última fecha de envío
        await this.prisma.weeklyReportConfig.update({
          where: { id: config.id },
          data: { lastSentAt: new Date() },
        });
      }

      this.logger.log(
        `✅ Scheduler completado: ${configs.length} reportes encolados`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error en scheduler de reportes semanales: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Convierte un Date a string del día de la semana
   * según el enum ReportDay de Prisma
   */
  private getDayOfWeekString(date: Date): ReportDay {
    const days: ReportDay[] = [
      ReportDay.SUNDAY,
      ReportDay.MONDAY,
      ReportDay.TUESDAY,
      ReportDay.WEDNESDAY,
      ReportDay.THURSDAY,
      ReportDay.FRIDAY,
      ReportDay.SATURDAY,
    ];
    return days[date.getDay()];
  }

  /**
   * Job manual para testing (opcional)
   * Puede ser llamado desde un endpoint o CLI
   */
  async triggerManualReport(workspaceId: string): Promise<void> {
    this.logger.log(
      `🔧 Activación manual de reporte para workspace: ${workspaceId}`,
    );

    const config = await this.prisma.weeklyReportConfig.findUnique({
      where: { workspaceId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!config) {
      throw new Error('Configuración de reportes no encontrada');
    }

    if (!config.enabled) {
      throw new Error('Reportes semanales no están habilitados');
    }

    if (!config.recipients || config.recipients.length === 0) {
      throw new Error('No hay destinatarios configurados');
    }

    await this.weeklyReportsQueue.add(
      'send-weekly-report',
      {
        workspaceId: config.workspaceId,
        workspaceName: config.workspace.name,
        recipients: config.recipients,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    this.logger.log(
      `✅ Reporte manual encolado para: ${config.workspace.name}`,
    );
  }
}
