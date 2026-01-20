import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@reputation-manager/database';
import { QUEUES, JOBS } from '@reputation-manager/shared-types';

@Processor(QUEUES.CAMPAIGNS)
export class CampaignProcessor extends WorkerHost {
  private readonly logger = new Logger(CampaignProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
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
    });

    if (!patient || !patient.hasConsent || patient.optedOutAt) {
      this.logger.warn(`Patient ${patientId} skipped for initial message`);
      return;
    }

    // TODO: Integrate actual TwilioService
    this.logger.log(`[Twilio Mock] Sending INITIAL to ${patient.phone}`);

    const message = await this.prisma.message.create({
      data: {
        type: 'INITIAL',
        channel: patient.preferredChannel || 'SMS',
        status: 'SENT',
        content: `Hola ${patient.name}, gracias por tu visita. ¿Cómo nos calificarías del 1 al 5?`,
        sentAt: new Date(),
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

    // TODO: Use TwilioService
    this.logger.log(`[Twilio Mock] Sending ${content} to ${patient.phone}`);

    await this.prisma.message.create({
      data: {
        type: messageType,
        channel: patient.preferredChannel || 'SMS',
        status: 'SENT',
        content,
        sentAt: new Date(),
        patientId,
        campaignId,
        workspaceId,
      },
    });

    return { processed: true, type };
  }
}
