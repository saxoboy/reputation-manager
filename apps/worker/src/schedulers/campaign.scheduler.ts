import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@reputation-manager/database';
import { QUEUES, JOBS } from '@reputation-manager/shared-types';

@Injectable()
export class CampaignScheduler {
  private readonly logger = new Logger(CampaignScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUES.CAMPAIGNS) private readonly campaignQueue: Queue,
  ) {}

  /**
   * Runs every 5 minutes.
   * Finds patients whose appointment + scheduledHoursAfter has passed
   * and enqueues SEND_INITIAL_MESSAGE for each one that hasn't been contacted yet.
   */
  @Cron('*/5 * * * *', {
    name: 'schedule-campaign-messages',
    timeZone: 'America/Guayaquil',
  })
  async schedulePendingMessages() {
    this.logger.log('🕐 Revisando pacientes pendientes de contacto...');

    try {
      // Find all active campaigns
      const activeCampaigns = await this.prisma.campaign.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          workspaceId: true,
          scheduledHoursAfter: true,
          name: true,
        },
      });

      if (activeCampaigns.length === 0) {
        this.logger.debug('No hay campañas activas. Nada que procesar.');
        return;
      }

      this.logger.log(
        `📋 Campañas activas encontradas: ${activeCampaigns.length}`,
      );

      let totalEnqueued = 0;

      for (const campaign of activeCampaigns) {
        // Calculate cutoff: appointment must have been at least scheduledHoursAfter hours ago
        const cutoff = new Date(
          Date.now() - campaign.scheduledHoursAfter * 60 * 60 * 1000,
        );

        // Find patients in this campaign who:
        // 1. Have consented and haven't opted out or been deleted
        // 2. Had their appointment before the cutoff
        // 3. Have NOT received an INITIAL message yet
        const patients = await this.prisma.patient.findMany({
          where: {
            campaignId: campaign.id,
            workspaceId: campaign.workspaceId,
            hasConsent: true,
            optedOutAt: null,
            dataDeletedAt: null,
            appointmentTime: { lte: cutoff },
            messages: {
              none: { type: 'INITIAL', campaignId: campaign.id },
            },
          },
          select: { id: true, name: true },
        });

        if (patients.length === 0) {
          this.logger.debug(
            `Campaña "${campaign.name}": ningún paciente pendiente.`,
          );
          continue;
        }

        this.logger.log(
          `Campaña "${campaign.name}": encolando ${patients.length} paciente(s)...`,
        );

        for (const patient of patients) {
          await this.campaignQueue.add(
            JOBS.SEND_INITIAL_MESSAGE,
            {
              patientId: patient.id,
              workspaceId: campaign.workspaceId,
              campaignId: campaign.id,
            },
            {
              attempts: 3,
              backoff: { type: 'exponential', delay: 5000 },
              removeOnComplete: true,
              removeOnFail: true,
            },
          );

          this.logger.log(
            `  ✅ Job encolado para paciente "${patient.name}" (${patient.id})`,
          );
          totalEnqueued++;
        }
      }

      this.logger.log(
        `✅ Scheduler completado: ${totalEnqueued} mensaje(s) encolado(s).`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error en scheduler de campañas: ${error.message}`,
        error.stack,
      );
    }
  }
}
