import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface LowCreditsAlertEmail {
  workspaceId: string;
  workspaceName?: string;
  ownerEmail: string;
  ownerName: string;
  alertLevel: 'critical' | 'warning' | 'info';
  remainingCredits: number;
  percentageRemaining: number;
  plan: string;
  planLimit: number;
  subject: string;
  ctaUrl: string;
}

export interface WelcomeEmail {
  email: string;
  name: string;
  workspaceName: string;
  loginUrl: string;
}

export interface InvitationEmail {
  email: string;
  workspaceName: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
}

export interface PatientMessage {
  patientEmail: string;
  patientName: string;
  subject: string;
  content: string;
}

export interface InvoiceEmail {
  email: string;
  name: string;
  invoiceUrl: string;
  amount: number;
  currency: string;
  date: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly enabled: boolean;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly resend: Resend | null = null;

  constructor(private readonly configService: ConfigService) {
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    this.enabled = !!resendApiKey;
    this.fromEmail =
      this.configService.get<string>('RESEND_FROM_EMAIL') ||
      'noreply@reputationmanager.com';
    this.fromName =
      this.configService.get<string>('RESEND_FROM_NAME') ||
      'Reputation Manager';

    if (!this.enabled || !resendApiKey) {
      this.logger.warn(
        '⚠️ EmailService is disabled: RESEND_API_KEY not configured',
      );
    } else {
      this.resend = new Resend(resendApiKey);
      this.logger.log('✅ EmailService initialized with Resend');
    }
  }

  /**
   * Check if email service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Send low credits alert email to workspace owner
   */
  async sendLowCreditsAlert(data: LowCreditsAlertEmail): Promise<boolean> {
    if (!this.enabled || !this.resend) {
      this.logger.warn('Email service disabled - skipping low credits alert');
      return false;
    }

    try {
      this.logger.log(
        `📧 Sending low credits alert (${data.alertLevel}) to ${data.ownerEmail}`,
      );

      const { error } = await this.resend.emails.send({
        to: data.ownerEmail,
        from: `${this.fromName} <${this.fromEmail}>`,
        subject: data.subject,
        html: this.generateLowCreditsEmailHtml(data),
      });

      if (error) {
        throw new Error(error.message);
      }

      this.logger.log(
        `✅ Low credits alert email sent to ${data.ownerEmail} (${data.alertLevel})`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send low credits alert to ${data.ownerEmail}`,
        error,
      );
      return false;
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(data: WelcomeEmail): Promise<boolean> {
    if (!this.enabled || !this.resend) {
      this.logger.warn('Email service disabled - skipping welcome email');
      return false;
    }

    try {
      this.logger.log(`📧 Sending welcome email to ${data.email}`);

      const { error } = await this.resend.emails.send({
        to: data.email,
        from: `${this.fromName} <${this.fromEmail}>`,
        subject: `¡Bienvenido a ${data.workspaceName}!`,
        html: this.generateWelcomeEmailHtml(data),
      });

      if (error) {
        throw new Error(error.message);
      }

      this.logger.log(`✅ Welcome email sent to ${data.email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${data.email}`, error);
      return false;
    }
  }

  /**
   * Send workspace invitation email
   */
  async sendInvitationEmail(data: InvitationEmail): Promise<boolean> {
    if (!this.enabled || !this.resend) {
      this.logger.warn('Email service disabled - skipping invitation email');
      return false;
    }

    try {
      this.logger.log(`📧 Sending invitation email to ${data.email}`);

      const roleLabel =
        data.role === 'DOCTOR'
          ? 'Doctor'
          : data.role === 'RECEPTIONIST'
            ? 'Recepcionista'
            : data.role;

      const { error } = await this.resend.emails.send({
        to: data.email,
        from: `${this.fromName} <${this.fromEmail}>`,
        subject: `Invitación a ${data.workspaceName} — Reputation Manager`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Invitación al equipo</h1>
  </div>
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;"><strong>${data.inviterName}</strong> te invitó a unirte a <strong>${data.workspaceName}</strong> en Reputation Manager como <strong>${roleLabel}</strong>.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Aceptar invitación
      </a>
    </div>
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">Este enlace expira en 7 días. Si no esperabas esta invitación, puedes ignorar este email.</p>
  </div>
</body>
</html>`,
      });

      if (error) throw new Error(error.message);

      this.logger.log(`✅ Invitation email sent to ${data.email}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send invitation email to ${data.email}`,
        error,
      );
      return false;
    }
  }

  /**
   * Send a feedback request or followup message to a patient via email
   * Returns a synthetic message ID (email provider ID) or null on failure
   */
  async sendPatientMessage(data: PatientMessage): Promise<string | null> {
    if (!this.enabled || !this.resend) {
      this.logger.warn('Email service disabled - skipping patient message');
      return null;
    }

    try {
      this.logger.log(`📧 Sending patient message to ${data.patientEmail}`);

      const result = await this.resend.emails.send({
        to: data.patientEmail,
        from: `${this.fromName} <${this.fromEmail}>`,
        subject: data.subject,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Reputation Manager</h1>
  </div>
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hola ${data.patientName},</p>
    <div style="font-size: 14px; white-space: pre-line;">${data.content.replace(/\n/g, '<br>')}</div>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
      Este mensaje fue enviado en nombre de tu médico. Si no deseas recibir más comunicaciones, responde STOP.
    </p>
  </div>
</body>
</html>`,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      const messageId = result.data?.id ?? null;
      this.logger.log(
        `✅ Patient message sent to ${data.patientEmail}: id=${messageId}`,
      );
      return messageId;
    } catch (error) {
      this.logger.error(
        `Failed to send patient message to ${data.patientEmail}`,
        error,
      );
      return null;
    }
  }

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(data: InvoiceEmail): Promise<boolean> {
    if (!this.enabled || !this.resend) {
      this.logger.warn('Email service disabled - skipping invoice email');
      return false;
    }

    try {
      this.logger.log(`📧 Sending invoice email to ${data.email}`);

      const { error } = await this.resend.emails.send({
        to: data.email,
        from: `${this.fromName} <${this.fromEmail}>`,
        subject: 'Tu factura de Reputation Manager',
        html: this.generateInvoiceEmailHtml(data),
      });

      if (error) {
        throw new Error(error.message);
      }

      this.logger.log(`✅ Invoice email sent to ${data.email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send invoice email to ${data.email}`, error);
      return false;
    }
  }

  /**
   * Generate HTML for low credits alert email
   */
  private generateLowCreditsEmailHtml(data: LowCreditsAlertEmail): string {
    const alertEmoji =
      data.alertLevel === 'critical'
        ? '🚨'
        : data.alertLevel === 'warning'
          ? '⚠️'
          : 'ℹ️';
    const alertColor =
      data.alertLevel === 'critical'
        ? '#ef4444'
        : data.alertLevel === 'warning'
          ? '#f59e0b'
          : '#3b82f6';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">${alertEmoji} Alerta de Créditos</h1>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hola ${data.ownerName},</p>

    <div style="background: ${alertColor}15; border-left: 4px solid ${alertColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-weight: bold; color: ${alertColor};">
        ${
          data.alertLevel === 'critical' && data.remainingCredits === 0
            ? '¡Has agotado todos tus créditos de mensajes!'
            : data.alertLevel === 'critical'
              ? `Solo te quedan ${data.remainingCredits} créditos (${data.percentageRemaining.toFixed(1)}%)`
              : data.alertLevel === 'warning'
                ? `Te quedan ${data.remainingCredits} créditos (${data.percentageRemaining.toFixed(1)}%)`
                : `Has usado el 50% de tus créditos`
        }
      </p>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin: 20px 0;">
      <strong>Plan actual:</strong> ${data.plan}<br>
      <strong>Créditos restantes:</strong> ${data.remainingCredits} de ${data.planLimit}
    </p>

    ${
      data.remainingCredits === 0
        ? `
    <p style="font-size: 14px;">
      No podrás enviar más mensajes hasta que agregues créditos o actualices tu plan.
    </p>
    `
        : `
    <p style="font-size: 14px;">
      Para evitar interrupciones en el servicio, te recomendamos comprar más créditos o actualizar tu plan.
    </p>
    `
    }

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        ${data.remainingCredits === 0 ? 'Comprar Créditos Ahora' : 'Ver Facturación'}
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
      Este es un mensaje automático de Reputation Manager.<br>
      Si tienes preguntas, contáctanos en soporte@reputationmanager.com
    </p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate HTML for welcome email
   */
  private generateWelcomeEmailHtml(data: WelcomeEmail): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Bienvenido a Reputation Manager!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 ¡Bienvenido!</h1>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hola ${data.name},</p>

    <p style="font-size: 14px;">
      Te damos la bienvenida a <strong>${data.workspaceName}</strong> en Reputation Manager.
      Estamos emocionados de ayudarte a mejorar la gestión de feedback de tus pacientes.
    </p>

    <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #667eea;">Primeros pasos:</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Configura tu primer consultorio</li>
        <li>Sube tu primera campaña de pacientes</li>
        <li>Personaliza tus templates de mensajes</li>
        <li>Revisa tus primeras métricas</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Ir al Dashboard
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
      ¿Necesitas ayuda? Contáctanos en soporte@reputationmanager.com
    </p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate HTML for invoice email
   */
  private generateInvoiceEmailHtml(data: InvoiceEmail): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu factura de Reputation Manager</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">💳 Nueva Factura</h1>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hola ${data.name},</p>

    <p style="font-size: 14px;">
      Tu pago ha sido procesado exitosamente. Aquí están los detalles de tu factura:
    </p>

    <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Fecha:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold;">${data.date}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Monto:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 20px; color: #667eea;">
            $${(data.amount / 100).toFixed(2)} ${data.currency.toUpperCase()}
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.invoiceUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Descargar Factura
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
      ¿Preguntas sobre tu factura? Contáctanos en facturacion@reputationmanager.com
    </p>
  </div>
</body>
</html>
    `;
  }
}
