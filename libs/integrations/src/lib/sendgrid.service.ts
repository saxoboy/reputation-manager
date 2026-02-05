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
      // Modo desarrollo: solo loguear el email
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.log('📧 EMAIL (Modo Desarrollo - No Enviado)');
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.log(`From: ${from}`);
      this.logger.log(`To: ${options.to}`);
      this.logger.log(`Subject: ${options.subject}`);
      this.logger.log('─────────────────────────────────────────');
      this.logger.log('HTML Preview (primeros 500 caracteres):');
      this.logger.log(options.html.substring(0, 500) + '...');
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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

      this.logger.log(`✅ Email sent successfully to ${options.to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

  async sendWorkspaceInvitation(options: {
    to: string;
    inviterName: string;
    workspaceName: string;
    inviteUrl: string;
  }): Promise<void> {
    const html = this.getInvitationTemplate(options);
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

  async sendWelcomeEmail(options: {
    to: string;
    name: string;
    workspaceName: string;
    dashboardUrl: string;
  }): Promise<void> {
    const html = this.getWelcomeTemplate(options);
    const text = `
      ¡Bienvenido a Reputation Manager!

      Hola ${options.name},

      Gracias por registrarte en Reputation Manager. Estamos emocionados de ayudarte a
      mejorar la gestión de feedback de tus pacientes y fortalecer tu reputación online.

      Tu workspace "${options.workspaceName}" está listo para usar.

      Próximos pasos:
      1. Completa la configuración de tu consultorio
      2. Carga tu primera lista de pacientes
      3. Envía tu primera campaña de feedback

      Accede a tu dashboard: ${options.dashboardUrl}

      Si tienes preguntas, estamos aquí para ayudarte.

      © 2026 Reputation Manager
    `;

    await this.sendEmail({
      to: options.to,
      subject: '¡Bienvenido a Reputation Manager! 🎉',
      html,
      text,
    });
  }

  async sendLowCreditsAlert(options: {
    to: string;
    workspaceName: string;
    remainingCredits: number;
    plan: string;
    topUpUrl: string;
  }): Promise<void> {
    const html = this.getLowCreditsTemplate(options);
    const text = `
      Alerta: Créditos de mensajes bajos

      Hola,

      Tu workspace "${options.workspaceName}" tiene solo ${options.remainingCredits} créditos de mensajes restantes.

      Plan actual: ${options.plan}

      Para evitar interrupciones en el servicio, considera:
      - Comprar más créditos
      - Actualizar tu plan

      Gestiona tus créditos: ${options.topUpUrl}

      © 2026 Reputation Manager
    `;

    await this.sendEmail({
      to: options.to,
      subject: `⚠️ Créditos de mensajes bajos - ${options.workspaceName}`,
      html,
      text,
    });
  }

  async sendWeeklySummary(options: {
    to: string;
    workspaceName: string;
    weekStart: string;
    weekEnd: string;
    stats: {
      messagesSent: number;
      responsesReceived: number;
      responseRate: number;
      averageRating: number;
      npsScore: number;
      happyPatients: number;
      unhappyPatients: number;
    };
    dashboardUrl: string;
  }): Promise<void> {
    const html = this.getWeeklySummaryTemplate(options);
    const text = `
      Resumen Semanal - ${options.workspaceName}

      Período: ${options.weekStart} - ${options.weekEnd}

      📊 Métricas de la Semana:
      - Mensajes enviados: ${options.stats.messagesSent}
      - Respuestas recibidas: ${options.stats.responsesReceived}
      - Tasa de respuesta: ${options.stats.responseRate.toFixed(1)}%
      - Calificación promedio: ${options.stats.averageRating.toFixed(1)}/5
      - NPS Score: ${options.stats.npsScore}
      - Pacientes felices: ${options.stats.happyPatients} (⭐ 4-5)
      - Pacientes insatisfechos: ${options.stats.unhappyPatients} (⭐ 1-3)

      Ver detalles completos: ${options.dashboardUrl}

      © 2026 Reputation Manager
    `;

    await this.sendEmail({
      to: options.to,
      subject: `📊 Resumen Semanal - ${options.workspaceName}`,
      html,
      text,
    });
  }

  // ============================================
  // HTML Templates
  // ============================================

  private getBaseStyle(): string {
    return `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f3f4f6;
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        text-align: center;
        border-radius: 8px 8px 0 0;
      }
      .content {
        background: white;
        padding: 30px;
        border-radius: 0 0 8px 8px;
      }
      .button {
        display: inline-block;
        padding: 12px 24px;
        background: #667eea;
        color: white !important;
        text-decoration: none;
        border-radius: 6px;
        margin: 20px 0;
        font-weight: 600;
      }
      .button-warning {
        background: #f59e0b;
      }
      .footer {
        text-align: center;
        color: #6b7280;
        font-size: 12px;
        margin-top: 30px;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        margin: 20px 0;
      }
      .stat-card {
        background: #f9fafb;
        padding: 15px;
        border-radius: 6px;
        text-align: center;
      }
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #667eea;
      }
      .stat-label {
        font-size: 12px;
        color: #6b7280;
        text-transform: uppercase;
      }
      .alert {
        background: #fef3c7;
        border-left: 4px solid #f59e0b;
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
      }
    `;
  }

  private getInvitationTemplate(options: {
    inviterName: string;
    workspaceName: string;
    inviteUrl: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${this.getBaseStyle()}</style>
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
  }

  private getWelcomeTemplate(options: {
    name: string;
    workspaceName: string;
    dashboardUrl: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${this.getBaseStyle()}</style>
        </head>
        <body>
          <div class="header">
            <h1>¡Bienvenido a Reputation Manager! 🎉</h1>
          </div>
          <div class="content">
            <h2>Hola ${options.name},</h2>
            <p>
              Gracias por registrarte en Reputation Manager. Estamos emocionados de ayudarte a
              mejorar la gestión de feedback de tus pacientes y fortalecer tu reputación online.
            </p>
            <p>
              Tu workspace <strong>"${options.workspaceName}"</strong> está listo para usar.
            </p>

            <h3>🚀 Próximos pasos:</h3>
            <ol>
              <li><strong>Configura tu consultorio</strong> - Agrega la información de tu práctica médica</li>
              <li><strong>Carga tu primera lista de pacientes</strong> - Usa nuestro formato CSV o agrégalos manualmente</li>
              <li><strong>Envía tu primera campaña</strong> - Recopila feedback automáticamente después de cada cita</li>
            </ol>

            <p style="text-align: center;">
              <a href="${options.dashboardUrl}" class="button">
                Acceder al Dashboard
              </a>
            </p>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              💡 <strong>Consejo:</strong> Los pacientes felices reciben automáticamente un enlace
              a Google Reviews, mientras que los insatisfechos pueden darte feedback privado para mejorar.
            </p>
          </div>
          <div class="footer">
            <p>¿Necesitas ayuda? Responde a este correo y te ayudaremos.</p>
            <p>© 2026 Reputation Manager. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;
  }

  private getLowCreditsTemplate(options: {
    workspaceName: string;
    remainingCredits: number;
    plan: string;
    topUpUrl: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${this.getBaseStyle()}</style>
        </head>
        <body>
          <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);">
            <h1>⚠️ Créditos de Mensajes Bajos</h1>
          </div>
          <div class="content">
            <div class="alert">
              <strong>Atención requerida:</strong> Tu workspace está a punto de quedarse sin créditos de mensajes.
            </div>

            <h2>Estado actual de ${options.workspaceName}</h2>
            <div class="stat-card" style="margin: 20px 0;">
              <div class="stat-value" style="color: #dc2626;">${options.remainingCredits}</div>
              <div class="stat-label">Créditos restantes</div>
            </div>

            <p>
              <strong>Plan actual:</strong> ${options.plan}
            </p>

            <p>
              Para evitar interrupciones en el servicio y seguir enviando mensajes a tus pacientes,
              te recomendamos tomar una de estas acciones:
            </p>

            <ul>
              <li>💳 <strong>Comprar más créditos</strong> - Recarga solo lo que necesites</li>
              <li>📈 <strong>Actualizar tu plan</strong> - Obtén más créditos mensuales y ahorra</li>
            </ul>

            <p style="text-align: center;">
              <a href="${options.topUpUrl}" class="button button-warning">
                Gestionar Créditos
              </a>
            </p>

            <p style="color: #6b7280; font-size: 14px;">
              Una vez que tus créditos lleguen a 0, no podrás enviar más mensajes hasta que los recargues.
            </p>
          </div>
          <div class="footer">
            <p>© 2026 Reputation Manager. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;
  }

  private getWeeklySummaryTemplate(options: {
    workspaceName: string;
    weekStart: string;
    weekEnd: string;
    stats: {
      messagesSent: number;
      responsesReceived: number;
      responseRate: number;
      averageRating: number;
      npsScore: number;
      happyPatients: number;
      unhappyPatients: number;
    };
    dashboardUrl: string;
  }): string {
    const { stats } = options;
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${this.getBaseStyle()}</style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Resumen Semanal</h1>
            <p style="margin: 0; opacity: 0.9;">${options.weekStart} - ${options.weekEnd}</p>
          </div>
          <div class="content">
            <h2>${options.workspaceName}</h2>
            <p>
              Aquí está el resumen de la actividad de tu workspace durante la última semana:
            </p>

            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${stats.messagesSent}</div>
                <div class="stat-label">Mensajes Enviados</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${stats.responsesReceived}</div>
                <div class="stat-label">Respuestas</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${stats.responseRate.toFixed(1)}%</div>
                <div class="stat-label">Tasa de Respuesta</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${stats.averageRating.toFixed(1)}/5</div>
                <div class="stat-label">Calificación Promedio</div>
              </div>
            </div>

            <h3>🎯 Destacados</h3>
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; border-radius: 4px;">
              <strong>NPS Score: ${stats.npsScore}</strong><br>
              <span style="font-size: 14px; color: #6b7280;">
                ${stats.npsScore >= 50 ? 'Excelente! 🎉' : stats.npsScore >= 0 ? 'Bien, pero puedes mejorar 💪' : 'Necesitas atención 🔍'}
              </span>
            </div>

            <div style="display: flex; gap: 15px; margin: 20px 0;">
              <div style="flex: 1; background: #ecfdf5; padding: 15px; border-radius: 6px;">
                <div style="font-size: 20px; font-weight: bold; color: #10b981;">
                  ${stats.happyPatients} ⭐
                </div>
                <div style="font-size: 12px; color: #6b7280;">Pacientes felices (4-5)</div>
              </div>
              <div style="flex: 1; background: #fef2f2; padding: 15px; border-radius: 6px;">
                <div style="font-size: 20px; font-weight: bold; color: #ef4444;">
                  ${stats.unhappyPatients} 😔
                </div>
                <div style="font-size: 12px; color: #6b7280;">Necesitan atención (1-3)</div>
              </div>
            </div>

            <p style="text-align: center;">
              <a href="${options.dashboardUrl}" class="button">
                Ver Dashboard Completo
              </a>
            </p>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              💡 <strong>Consejo:</strong> Revisa el feedback de los pacientes insatisfechos para
              identificar áreas de mejora en tu práctica.
            </p>
          </div>
          <div class="footer">
            <p>¿No quieres recibir estos resúmenes? Puedes desactivarlos en tu configuración.</p>
            <p>© 2026 Reputation Manager. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `;
  }
}
