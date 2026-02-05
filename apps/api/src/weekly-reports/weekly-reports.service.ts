import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@reputation-manager/database';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { UpdateWeeklyReportConfigDto } from './dto';
import { SendWeeklyReportJobData } from '@reputation-manager/shared-types';

@Injectable()
export class WeeklyReportsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('weekly-reports')
    private readonly weeklyReportsQueue: Queue<SendWeeklyReportJobData>,
  ) {}

  /**
   * Obtener configuración de reportes semanales
   * Si no existe, la crea con valores por defecto
   */
  async getConfig(workspaceId: string) {
    let config = await this.prisma.weeklyReportConfig.findUnique({
      where: { workspaceId },
    });

    // Si no existe, crear con valores por defecto
    if (!config) {
      config = await this.prisma.weeklyReportConfig.create({
        data: {
          workspaceId,
          enabled: false,
          dayOfWeek: 'MONDAY',
          recipients: [],
        },
      });
    }

    return config;
  }

  /**
   * Actualizar configuración de reportes semanales
   */
  async updateConfig(workspaceId: string, dto: UpdateWeeklyReportConfigDto) {
    // Verificar que el workspace existe
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace no encontrado');
    }

    // Upsert: crear si no existe, actualizar si existe
    const config = await this.prisma.weeklyReportConfig.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        enabled: dto.enabled ?? false,
        dayOfWeek: dto.dayOfWeek ?? 'MONDAY',
        recipients: dto.recipients ?? [],
      },
      update: {
        enabled: dto.enabled,
        dayOfWeek: dto.dayOfWeek,
        recipients: dto.recipients,
      },
    });

    return {
      message: 'Configuración de reportes semanales actualizada',
      config,
    };
  }

  /**
   * Enviar reporte de prueba
   * Encola un job inmediato para envío
   */
  async sendTestReport(
    workspaceId: string,
    workspaceName: string,
    testEmail: string,
  ) {
    await this.weeklyReportsQueue.add(
      'send-weekly-report',
      {
        workspaceId,
        workspaceName,
        recipients: [testEmail],
      },
      {
        priority: 1, // Alta prioridad
        attempts: 2,
      },
    );

    return {
      message: `Reporte de prueba encolado. Se enviará a: ${testEmail}`,
      testEmail,
    };
  }
}
