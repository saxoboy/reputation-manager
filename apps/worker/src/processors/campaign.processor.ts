import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@reputation-manager/database';
import {
  TwilioService,
  WhatsAppService,
} from '@reputation-manager/integrations';
import { QUEUES, JOBS } from '@reputation-manager/shared-types';

@Processor(QUEUES.CAMPAIGNS)
export class CampaignProcessor extends WorkerHost {
  private readonly logger = new Logger(CampaignProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly twilioService: TwilioService,
    private readonly whatsAppService: WhatsAppService,
    @InjectQueue(QUEUES.CAMPAIGNS) private campaignQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    try {
      switch (job.name) {
        case JOBS.SEND_INITIAL_MESSAGE:
          return this.handleSendInitialMessage(job);
        case JOBS.SEND_FOLLOWUP:
          return this.handleSendFollowup(job);
        case JOBS.HANDLE_RESPONSE:
          return this.handleResponse(job);
        default:
          this.logger.warn(`Unknown job name: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}`, error);
      throw error;
    }
  }

  private async handleSendInitialMessage(job: Job): Promise<any> {
    const { patientId, workspaceId, campaignId } = job.data;

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        workspace: {
          select: {
            defaultChannel: true,
            smsEnabled: true,
            whatsappEnabled: true,
            emailEnabled: true,
          },
        },
      },
    });

    if (!patient || !patient.hasConsent || patient.optedOutAt) {
      this.logger.warn(`Patient ${patientId} skipped for initial message`);
      return;
    }

    // Determinar canal a usar basado en:
    // 1. Preferencia del paciente si existe
    // 2. Canal por defecto del workspace
    // 3. Validar que el canal elegido esté habilitado
    let channel = patient.preferredChannel || patient.workspace.defaultChannel;

    // Validar que el canal esté habilitado, si no, buscar alternativa
    if (channel === 'SMS' && !patient.workspace.smsEnabled) {
      if (patient.workspace.whatsappEnabled) {
        channel = 'WHATSAPP';
      } else if (patient.workspace.emailEnabled) {
        channel = 'EMAIL';
      } else {
        this.logger.error(
          `No hay canales habilitados para workspace ${workspaceId}`,
        );
        throw new Error('No messaging channels enabled for workspace');
      }
    } else if (channel === 'WHATSAPP' && !patient.workspace.whatsappEnabled) {
      if (patient.workspace.smsEnabled) {
        channel = 'SMS';
      } else if (patient.workspace.emailEnabled) {
        channel = 'EMAIL';
      } else {
        this.logger.error(
          `No hay canales habilitados para workspace ${workspaceId}`,
        );
        throw new Error('No messaging channels enabled for workspace');
      }
    } else if (channel === 'EMAIL' && !patient.workspace.emailEnabled) {
      if (patient.workspace.smsEnabled) {
        channel = 'SMS';
      } else if (patient.workspace.whatsappEnabled) {
        channel = 'WHATSAPP';
      } else {
        this.logger.error(
          `No hay canales habilitados para workspace ${workspaceId}`,
        );
        throw new Error('No messaging channels enabled for workspace');
      }
    }

    const messageContent =
      channel === 'WHATSAPP'
        ? 'Template: feedback_request_v1'
        : `Hola ${patient.name}, gracias por tu visita. ¿Cómo nos calificarías del 1 al 5?`;
    let externalId = '';

    if (channel === 'WHATSAPP') {
      const success = await this.whatsAppService.sendTemplateMessage(
        patient.phone,
        'feedback_request_v1',
        patient.language || 'es',
        [
          {
            type: 'body',
            parameters: [{ type: 'text', text: patient.name }],
          },
        ],
      );

      if (!success) {
        throw new Error('Failed to send WhatsApp template');
      }
      externalId = 'wa-pending-id'; // TODO: Update service to return ID
    } else if (channel === 'SMS') {
      // Send SMS via Twilio
      const smsResult = await this.twilioService.sendSMS({
        to: patient.phone,
        body: messageContent,
      });

      if (!smsResult.success) {
        this.logger.error(
          `Failed to send SMS to ${patient.phone}: ${smsResult.error}`,
        );
        throw new Error(smsResult.error);
      }
      externalId = smsResult.messageId;
    } else if (channel === 'EMAIL') {
      // TODO: Implementar envío de Email cuando SendGrid esté configurado
      this.logger.warn('Email channel not yet implemented, skipping');
      return;
    }

    const message = await this.prisma.message.create({
      data: {
        type: 'INITIAL',
        channel,
        status: 'SENT',
        content: messageContent,
        sentAt: new Date(),
        externalId,
        patientId,
        campaignId,
        workspaceId,
      },
    });

    return { success: true, messageId: message.id };
  }

  private async handleResponse(job: Job): Promise<any> {
    const { messageId, rating, text, from } = job.data;

    this.logger.log(
      `Handling response for message ${messageId} with rating ${rating}`,
    );

    // Update the original message
    const originalMessage = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        rating,
        status: 'REPLIED',
      },
      include: { patient: true },
    });

    if (!originalMessage) {
      this.logger.error(`Original message ${messageId} not found`);
      return;
    }

    // Determine follow-up type
    if (rating >= 4) {
      await this.campaignQueue.add(
        JOBS.SEND_FOLLOWUP,
        {
          patientId: originalMessage.patientId,
          workspaceId: originalMessage.workspaceId,
          campaignId: originalMessage.campaignId,
          type: 'HAPPY',
        },
        { delay: 2000 },
      ); // Small delay for UX
    } else {
      await this.campaignQueue.add(
        JOBS.SEND_FOLLOWUP,
        {
          patientId: originalMessage.patientId,
          workspaceId: originalMessage.workspaceId,
          campaignId: originalMessage.campaignId,
          type: 'UNHAPPY',
        },
        { delay: 2000 },
      );
    }

    return { processed: true, rating };
  }

  private async handleSendFollowup(job: Job): Promise<any> {
    const { patientId, workspaceId, campaignId, type } = job.data;
    this.logger.log(`Sending FOLLOWUP (${type}) to ${patientId}`);

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) return;

    const content =
      type === 'HAPPY'
        ? '¡Nos alegra mucho! Por favor ayúdanos con una reseña en Google: https://g.page/review/...'
        : 'Lamentamos escuchar eso. Por favor cuéntanos más para mejorar: https://forms.gle/...';

    const messageType =
      type === 'HAPPY' ? 'FOLLOWUP_HAPPY' : 'FOLLOWUP_UNHAPPY';

    const channel = patient.preferredChannel || 'SMS';
    let externalId = '';

    if (channel === 'WHATSAPP') {
      const success = await this.whatsAppService.sendTextMessage(
        patient.phone,
        content,
      );
      if (!success) {
        throw new Error('Failed to send WhatsApp text');
      }
      externalId = 'wa-pending-id';
    } else {
      // Send SMS via Twilio
      const smsResult = await this.twilioService.sendSMS({
        to: patient.phone,
        body: content,
      });

      if (!smsResult.success) {
        this.logger.error(
          `Failed to send followup SMS to ${patient.phone}: ${smsResult.error}`,
        );
        throw new Error(smsResult.error);
      }
      externalId = smsResult.messageId;
    }

    await this.prisma.message.create({
      data: {
        type: messageType,
        channel,
        status: 'SENT',
        content,
        sentAt: new Date(),
        externalId,
        patientId,
        campaignId,
        workspaceId,
      },
    });

    return { processed: true, type };
  }
}
