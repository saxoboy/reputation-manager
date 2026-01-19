import { Injectable, Logger } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);

  constructor() {
    const apiKey = process.env['SENDGRID_API_KEY'];
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.logger.log('SendGrid configured successfully');
    } else {
      this.logger.warn(
        'SENDGRID_API_KEY not found. Email sending will be disabled.',
      );
    }
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    const from = process.env['SENDGRID_FROM_EMAIL'] || 'noreply@example.com';

    if (!process.env['SENDGRID_API_KEY']) {
      this.logger.warn(
        `Email not sent (SendGrid not configured): ${options.subject} to ${options.to}`,
      );
      return;
    }

    try {
      await sgMail.send({
        to: options.to,
        from,
        subject: options.subject,
        html: options.html,
        text: options.text || '',
      });

      this.logger.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

  async sendWorkspaceInvitation(options: {
    to: string;
    inviterName: string;
    workspaceName: string;
    inviteUrl: string;
  }): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Reputation Manager</h1>
          </div>
          <div class="content">
            <h2>¡Has sido invitado!</h2>
            <p>Hola,</p>
            <p>
              <strong>${options.inviterName}</strong> te ha invitado a unirte al workspace 
              <strong>${options.workspaceName}</strong> en Reputation Manager.
            </p>
            <p>
              Reputation Manager es una plataforma de gestión de feedback para profesionales 
              de la salud que te ayuda a mejorar tu reputación online.
            </p>
            <p style="text-align: center;">
              <a href="${options.inviteUrl}" class="button">
                Aceptar Invitación
              </a>
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              Si no esperabas esta invitación, puedes ignorar este correo.
            </p>
          </div>
          <div class="footer">
            <p>© 2026 Reputation Manager. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;

    const text = `
      ¡Has sido invitado!

      ${options.inviterName} te ha invitado a unirte al workspace ${options.workspaceName} en Reputation Manager.

      Para aceptar la invitación, visita: ${options.inviteUrl}

      Si no esperabas esta invitación, puedes ignorar este correo.

      © 2026 Reputation Manager
    `;

    await this.sendEmail({
      to: options.to,
      subject: `Invitación a ${options.workspaceName} - Reputation Manager`,
      html,
      text,
    });
  }
}
