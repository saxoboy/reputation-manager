import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@reputation-manager/database';
import {
  TwilioService,
  WhatsAppService,
  GooglePlacesService,
  EmailService,
} from '@reputation-manager/integrations';
import { QUEUES, JOBS } from '@reputation-manager/shared-types';

@Processor(QUEUES.CAMPAIGNS)
export class CampaignProcessor extends WorkerHost {
  private readonly logger = new Logger(CampaignProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly twilioService: TwilioService,
    private readonly whatsAppService: WhatsAppService,
    private readonly googlePlacesService: GooglePlacesService,
    private readonly emailService: EmailService,
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

  /**
   * Validates that workspace has at least 1 credit available (read-only, no deduction).
   * Throws if insufficient credits. Used as a fast-fail check before attempting to send.
   */
  private async validateCredits(workspaceId: string): Promise<void> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { plan: true, messageCredits: true },
    });

    if (!workspace) throw new Error('Workspace not found');
    if (workspace.plan === 'ENTERPRISE') return;

    if (workspace.messageCredits < 1) {
      this.logger.error(
        `Workspace ${workspaceId} has insufficient credits: ${workspace.messageCredits}`,
      );
      throw new Error(
        `Insufficient message credits. You have ${workspace.messageCredits} credits but need 1. Please purchase more credits or upgrade your plan.`,
      );
    }
  }

  /**
   * Deducts 1 credit from workspace after a successful send.
   * Creates transaction record for audit trail and checks for low credit alerts.
   */
  private async checkAndDeductCredits(
    workspaceId: string,
  ): Promise<{ remainingCredits: number; plan: string }> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, plan: true, messageCredits: true },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // ENTERPRISE has unlimited credits
    if (workspace.plan === 'ENTERPRISE') {
      this.logger.debug(
        `Workspace ${workspaceId} has ENTERPRISE plan - unlimited credits`,
      );
      return { remainingCredits: -1, plan: workspace.plan }; // -1 = unlimited
    }

    // Check if has enough credits
    if (workspace.messageCredits < 1) {
      this.logger.error(
        `Workspace ${workspaceId} has insufficient credits: ${workspace.messageCredits}`,
      );
      throw new Error(
        `Insufficient message credits. You have ${workspace.messageCredits} credits but need 1. Please purchase more credits or upgrade your plan.`,
      );
    }

    // Deduct 1 credit atomically
    const updated = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { messageCredits: { decrement: 1 } },
      select: { messageCredits: true },
    });

    const remainingCredits = updated.messageCredits;

    // Create transaction record for audit trail
    try {
      await this.prisma.transaction.create({
        data: {
          workspaceId,
          type: 'CREDIT_ADJUSTMENT',
          status: 'SUCCEEDED',
          amount: 0,
          currency: 'usd',
          creditsAdded: -1, // Negative for deduction
          description: 'Message sent - 1 credit deducted',
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create transaction record for workspace ${workspaceId}`,
        error,
      );
      // Don't throw - transaction record is for audit only
    }

    this.logger.log(
      `✅ Deducted 1 credit from workspace ${workspaceId}. Remaining: ${remainingCredits}`,
    );

    // Check for low credits warning and notifications
    await this.checkLowCredits(workspaceId, workspace.plan, remainingCredits);

    return { remainingCredits, plan: workspace.plan };
  }

  /**
   * Check if credits are running low and send email notifications
   */
  private async checkLowCredits(
    workspaceId: string,
    plan: string,
    remainingCredits: number,
  ): Promise<void> {
    // Define credit thresholds per plan for warnings
    const planLimits: Record<string, number> = {
      FREE: 50,
      STARTER: 500,
      PROFESSIONAL: 2000,
      ENTERPRISE: -1, // Unlimited
    };

    const planLimit = planLimits[plan] || 0;
    if (planLimit === -1) return; // ENTERPRISE has unlimited

    const percentageRemaining = (remainingCredits / planLimit) * 100;

    // Get workspace owner for email notifications
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        users: {
          where: { role: 'OWNER' },
          take: 1,
          include: { user: true },
        },
      },
    });

    if (
      !workspace ||
      workspace.users.length === 0 ||
      !workspace.users[0].user
    ) {
      this.logger.warn(
        `Cannot send low credits alert: Workspace ${workspaceId} has no owner`,
      );
      return;
    }

    const ownerUser = workspace.users[0].user;
    const billingUrl = `${process.env.FRONTEND_URL || 'http://localhost:4000'}/dashboard/billing`;
    const baseAlertData = {
      workspaceId,
      workspaceName: workspace.name,
      ownerEmail: ownerUser.email,
      ownerName: ownerUser.name || 'Doctor',
      plan,
      planLimit: planLimit,
      percentageRemaining,
      ctaUrl: billingUrl,
    };

    // CRITICAL: No credits left
    if (remainingCredits === 0) {
      this.logger.error(
        `🚨 CRITICAL: Workspace ${workspaceId} has 0 credits remaining! Messages cannot be sent.`,
      );

      try {
        await this.emailService.sendLowCreditsAlert({
          ...baseAlertData,
          remainingCredits: 0,
          alertLevel: 'critical',
          subject: 'URGENTE: Se han agotado tus créditos de mensajes',
        });
        this.logger.log(
          `Email alert sent to ${ownerUser.email} for 0 credits remaining`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send email alert: ${error.message}`,
          error.stack,
        );
      }
      return;
    }

    // CRITICAL: < 10% remaining
    if (percentageRemaining < 10) {
      this.logger.warn(
        `🚨 CRITICAL: Workspace ${workspaceId} has only ${remainingCredits} credits remaining (${percentageRemaining.toFixed(1)}% of ${plan} plan limit)`,
      );

      try {
        await this.emailService.sendLowCreditsAlert({
          ...baseAlertData,
          remainingCredits,
          alertLevel: 'critical',
          subject: 'CRÍTICO: Menos del 10% de tus créditos disponibles',
        });
        this.logger.log(
          `Email alert sent to ${ownerUser.email} for <10% credits remaining`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send email alert: ${error.message}`,
          error.stack,
        );
      }
    }
    // WARNING: < 20% remaining
    else if (percentageRemaining < 20) {
      this.logger.warn(
        `⚠️ WARNING: Workspace ${workspaceId} has ${remainingCredits} credits remaining (${percentageRemaining.toFixed(1)}% of ${plan} plan)`,
      );

      try {
        await this.emailService.sendLowCreditsAlert({
          ...baseAlertData,
          remainingCredits,
          alertLevel: 'warning',
          subject: 'Advertencia: Créditos de mensajes bajando',
        });
        this.logger.log(
          `Email alert sent to ${ownerUser.email} for <20% credits remaining`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send email alert: ${error.message}`,
          error.stack,
        );
      }
    }
    // INFO: First time dropping below 50%
    else if (
      percentageRemaining < 50 &&
      remainingCredits === Math.floor(planLimit / 2)
    ) {
      this.logger.log(
        `ℹ️ INFO: Workspace ${workspaceId} has used 50% of credits (${remainingCredits} remaining)`,
      );

      try {
        await this.emailService.sendLowCreditsAlert({
          ...baseAlertData,
          remainingCredits,
          alertLevel: 'info',
          subject: 'Has usado el 50% de tus créditos de mensajes',
        });
        this.logger.log(
          `Email alert sent to ${ownerUser.email} for 50% credits used`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send email alert: ${error.message}`,
          error.stack,
        );
      }
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

    // 💳 Validate credits before attempting send (read-only, no deduction yet)
    await this.validateCredits(workspaceId);

    // Create message as PENDING first so the scheduler doesn't re-enqueue
    // this patient while the send is in progress or if it fails.
    // On BullMQ retries we reuse the same record via job.data.pendingMessageId.
    const pendingMessageId: string | undefined = job.data.pendingMessageId;
    let message;

    if (pendingMessageId) {
      message = await this.prisma.message.update({
        where: { id: pendingMessageId },
        data: { status: 'PENDING' },
      });
    } else {
      message = await this.prisma.message.create({
        data: {
          type: 'INITIAL',
          channel,
          status: 'PENDING',
          content: messageContent,
          patientId,
          campaignId,
          workspaceId,
        },
      });
      await job.updateData({ ...job.data, pendingMessageId: message.id });
    }

    try {
      let externalId = '';

      if (channel === 'WHATSAPP') {
        // TODO: Replace 'hello_world' with 'feedback_request_v1' once the template
        // is approved in Meta WhatsApp Manager. hello_world is the default sandbox template.
        const waMessageId = await this.whatsAppService.sendTemplateMessage(
          patient.phone,
          'hello_world',
          'en_US',
          [],
        );

        if (!waMessageId) {
          throw new Error('Failed to send WhatsApp template');
        }
        externalId = waMessageId;
      } else if (channel === 'SMS') {
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
        if (!patient.email) {
          this.logger.warn(
            `Patient ${patientId} has no email address, skipping EMAIL channel`,
          );
          await this.prisma.message.update({
            where: { id: message.id },
            data: { status: 'FAILED' },
          });
          return;
        }
        const emailId = await this.emailService.sendPatientMessage({
          patientEmail: patient.email,
          patientName: patient.name,
          subject: '¿Cómo fue tu experiencia con nosotros?',
          content: messageContent,
        });
        if (!emailId) {
          throw new Error('Failed to send patient email');
        }
        externalId = emailId;
      }

      // 💳 Deduct 1 credit only after successful send
      await this.checkAndDeductCredits(workspaceId);

      await this.prisma.message.update({
        where: { id: message.id },
        data: { status: 'SENT', sentAt: new Date(), externalId },
      });

      return { success: true, messageId: message.id };
    } catch (error) {
      await this.prisma.message.update({
        where: { id: message.id },
        data: { status: 'FAILED' },
      });
      throw error; // Re-throw so BullMQ retries (attempts: 3)
    }
  }

  private async handleResponse(job: Job): Promise<any> {
    const { messageId, rating } = job.data;

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
      include: {
        campaign: {
          include: {
            practice: true,
          },
        },
      },
    });

    if (!patient) return;

    let content: string;
    const messageType =
      type === 'HAPPY' ? 'FOLLOWUP_HAPPY' : 'FOLLOWUP_UNHAPPY';

    if (type === 'HAPPY') {
      // Generar URL de Google Review usando el Place ID del consultorio
      const practice = patient.campaign.practice;
      let reviewUrl = 'https://g.page/review'; // Fallback genérico

      if (practice.googlePlaceId) {
        // Usar el Place ID para generar URL específica
        reviewUrl = this.googlePlacesService.generateReviewUrl(
          practice.googlePlaceId,
        );
        this.logger.log(
          `Generated review URL for practice ${practice.name}: ${reviewUrl}`,
        );
      } else {
        this.logger.warn(
          `Practice ${practice.name} doesn't have a Google Place ID. Using fallback review URL.`,
        );
      }

      content = `¡Nos alegra mucho que hayas tenido una buena experiencia! 🎉\n\n¿Nos ayudarías compartiendo tu opinión en Google? Te tomará menos de 1 minuto:\n\n${reviewUrl}\n\n¡Muchas gracias! 🙏`;
    } else {
      // Para pacientes insatisfechos, enviar a formulario privado
      const feedbackUrl = `${process.env['FRONTEND_URL'] || 'http://localhost:3000'}/feedback/${patient.id}`;

      content = `Lamentamos que tu experiencia no haya sido la esperada. 😔\n\nTu opinión es muy importante para nosotros y queremos mejorar. ¿Podrías compartir más detalles de manera privada?\n\n${feedbackUrl}\n\nGracias por ayudarnos a ser mejores. 🙏`;
    }

    const channel = patient.preferredChannel || 'SMS';
    let externalId = '';

    // 💳 Validate credits before attempting send (read-only, no deduction yet)
    await this.validateCredits(workspaceId);

    if (channel === 'WHATSAPP') {
      const waMessageId = await this.whatsAppService.sendTextMessage(
        patient.phone,
        content,
      );
      if (!waMessageId) {
        throw new Error('Failed to send WhatsApp text');
      }
      externalId = waMessageId;
    } else if (channel === 'EMAIL') {
      if (!patient.email) {
        this.logger.warn(
          `Patient ${patientId} has no email for followup, skipping`,
        );
        return;
      }
      const subject =
        type === 'HAPPY'
          ? '¡Gracias por tu buena valoración!'
          : 'Tu opinión es importante para nosotros';
      const emailId = await this.emailService.sendPatientMessage({
        patientEmail: patient.email,
        patientName: patient.name,
        subject,
        content,
      });
      if (!emailId) {
        throw new Error('Failed to send followup email');
      }
      externalId = emailId;
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

    // 💳 Deduct 1 credit only after successful send
    await this.checkAndDeductCredits(workspaceId);

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
