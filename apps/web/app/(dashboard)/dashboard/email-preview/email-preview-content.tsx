'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../../components/ui/tabs';
import { Mail } from 'lucide-react';

export default function EmailPreviewContent() {
  const [activeEmail, setActiveEmail] = useState<string>('welcome');

  // Datos de ejemplo para los templates
  const emailData = {
    welcome: {
      name: 'Dr. Juan Pérez',
      email: 'juan.perez@example.com',
      dashboardUrl: 'http://localhost:4000/dashboard',
    },
    lowCredits: {
      name: 'Dr. María López',
      creditsRemaining: 8,
      plan: 'STARTER',
      upgradeUrl: 'http://localhost:4000/dashboard/billing',
    },
    weeklySummary: {
      name: 'Dr. Carlos Gómez',
      weekStart: '2026-01-27',
      weekEnd: '2026-02-02',
      messagesSent: 45,
      responsesReceived: 38,
      responseRate: 84.4,
      averageRating: 4.6,
      nps: 85,
      happyPatients: 35,
      unhappyPatients: 3,
      dashboardUrl: 'http://localhost:4000/dashboard',
    },
    invitation: {
      inviterName: 'Dr. Ana Torres',
      workspaceName: 'Consultorio Central',
      inviteUrl: 'http://localhost:4000/auth/accept-invite?token=abc123',
    },
  };

  const getEmailHtml = (type: string): string => {
    const baseStyle = `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      background: #f9fafb;
      padding: 20px;
    `;

    switch (type) {
      case 'welcome':
        return `
          <div style="${baseStyle}">
            <div style="background: white; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h1 style="color: #1f2937; margin-bottom: 24px;">¡Bienvenido a Reputation Manager! 🎉</h1>
              <p style="color: #4b5563; line-height: 1.6;">Hola <strong>${emailData.welcome.name}</strong>,</p>
              <p style="color: #4b5563; line-height: 1.6;">
                Estamos emocionados de tenerte con nosotros. Reputation Manager te ayudará a mejorar
                tu reputación online gestionando el feedback de tus pacientes de manera inteligente.
              </p>
              <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <h3 style="color: #1f2937; margin-bottom: 12px;">Primeros Pasos:</h3>
                <ul style="color: #4b5563; line-height: 1.8;">
                  <li>Configura tu consultorio y datos de Google Maps</li>
                  <li>Sube tu primera lista de pacientes</li>
                  <li>Crea tu primera campaña de feedback</li>
                </ul>
              </div>
              <a href="${emailData.welcome.dashboardUrl}"
                 style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px;
                        border-radius: 6px; text-decoration: none; margin-top: 20px;">
                Ir al Dashboard
              </a>
            </div>
          </div>
        `;

      case 'lowCredits':
        return `
          <div style="${baseStyle}">
            <div style="background: white; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h1 style="color: #dc2626; margin-bottom: 24px;">⚠️ Créditos de Mensajes Bajos</h1>
              <p style="color: #4b5563; line-height: 1.6;">Hola <strong>${emailData.lowCredits.name}</strong>,</p>
              <p style="color: #4b5563; line-height: 1.6;">
                Tu cuenta tiene solo <strong style="color: #dc2626;">${emailData.lowCredits.creditsRemaining} créditos</strong>
                de mensajes restantes. Para evitar interrupciones en tus campañas, te recomendamos recargar pronto.
              </p>
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #92400e;">
                  <strong>Plan actual:</strong> ${emailData.lowCredits.plan}<br>
                  <strong>Mensajes restantes:</strong> ${emailData.lowCredits.creditsRemaining}
                </p>
              </div>
              <a href="${emailData.lowCredits.upgradeUrl}"
                 style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px;
                        border-radius: 6px; text-decoration: none; margin-top: 20px;">
                Comprar Créditos
              </a>
            </div>
          </div>
        `;

      case 'weeklySummary': {
        const data = emailData.weeklySummary;
        return `
          <div style="${baseStyle}">
            <div style="background: white; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h1 style="color: #1f2937; margin-bottom: 8px;">📊 Resumen Semanal</h1>
              <p style="color: #6b7280; margin-bottom: 24px;">
                ${data.weekStart} - ${data.weekEnd}
              </p>
              <p style="color: #4b5563; line-height: 1.6;">Hola <strong>${data.name}</strong>,</p>
              <p style="color: #4b5563; line-height: 1.6; margin-bottom: 32px;">
                Aquí está tu resumen de actividad de la última semana:
              </p>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                <div style="background: #eff6ff; border-radius: 8px; padding: 20px;">
                  <div style="color: #1e40af; font-size: 32px; font-weight: bold;">${data.messagesSent}</div>
                  <div style="color: #60a5fa; font-size: 14px;">Mensajes Enviados</div>
                </div>
                <div style="background: #f0fdf4; border-radius: 8px; padding: 20px;">
                  <div style="color: #15803d; font-size: 32px; font-weight: bold;">${data.responsesReceived}</div>
                  <div style="color: #4ade80; font-size: 14px;">Respuestas Recibidas</div>
                </div>
                <div style="background: #fef3c7; border-radius: 8px; padding: 20px;">
                  <div style="color: #92400e; font-size: 32px; font-weight: bold;">${data.responseRate}%</div>
                  <div style="color: #f59e0b; font-size: 14px;">Tasa de Respuesta</div>
                </div>
                <div style="background: #fce7f3; border-radius: 8px; padding: 20px;">
                  <div style="color: #be123c; font-size: 32px; font-weight: bold;">${data.averageRating}</div>
                  <div style="color: #f472b6; font-size: 14px;">Calificación Promedio</div>
                </div>
              </div>

              <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                  <span style="color: #4b5563;">NPS Score</span>
                  <strong style="color: #059669;">${data.nps}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                  <span style="color: #4b5563;">Pacientes Felices (4-5)</span>
                  <strong style="color: #059669;">${data.happyPatients}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #4b5563;">Pacientes Insatisfechos (1-3)</span>
                  <strong style="color: #dc2626;">${data.unhappyPatients}</strong>
                </div>
              </div>

              <a href="${data.dashboardUrl}"
                 style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px;
                        border-radius: 6px; text-decoration: none;">
                Ver Detalles Completos
              </a>
            </div>
          </div>
        `;
      }

      case 'invitation':
        return `
          <div style="${baseStyle}">
            <div style="background: white; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h1 style="color: #1f2937; margin-bottom: 24px;">📨 Invitación a Workspace</h1>
              <p style="color: #4b5563; line-height: 1.6;">
                <strong>${emailData.invitation.inviterName}</strong> te ha invitado a unirte a
                <strong>${emailData.invitation.workspaceName}</strong> en Reputation Manager.
              </p>
              <p style="color: #4b5563; line-height: 1.6; margin: 24px 0;">
                Podrás gestionar campañas de feedback, ver estadísticas y colaborar con el equipo.
              </p>
              <a href="${emailData.invitation.inviteUrl}"
                 style="display: inline-block; background: #10b981; color: white; padding: 12px 24px;
                        border-radius: 6px; text-decoration: none; margin-top: 20px;">
                Aceptar Invitación
              </a>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">
                Si no esperabas esta invitación, puedes ignorar este correo.
              </p>
            </div>
          </div>
        `;

      default:
        return '<div>Email type not found</div>';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Email Templates Preview</h1>
        <p className="text-muted-foreground">
          Vista previa de los emails transaccionales del sistema (solo
          desarrollo)
        </p>
      </div>

      <Tabs value={activeEmail} onValueChange={setActiveEmail}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="welcome">
            <Mail className="mr-2 h-4 w-4" />
            Bienvenida
          </TabsTrigger>
          <TabsTrigger value="lowCredits">
            <Mail className="mr-2 h-4 w-4" />
            Créditos Bajos
          </TabsTrigger>
          <TabsTrigger value="weeklySummary">
            <Mail className="mr-2 h-4 w-4" />
            Resumen Semanal
          </TabsTrigger>
          <TabsTrigger value="invitation">
            <Mail className="mr-2 h-4 w-4" />
            Invitación
          </TabsTrigger>
        </TabsList>

        {['welcome', 'lowCredits', 'weeklySummary', 'invitation'].map(
          (type) => (
            <TabsContent key={type} value={type} className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {type === 'welcome' && 'Email de Bienvenida'}
                    {type === 'lowCredits' && 'Alerta de Créditos Bajos'}
                    {type === 'weeklySummary' && 'Resumen Semanal'}
                    {type === 'invitation' && 'Invitación a Workspace'}
                  </CardTitle>
                  <CardDescription>
                    Vista previa del template HTML enviado por SendGrid
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <iframe
                      srcDoc={getEmailHtml(type)}
                      style={{
                        width: '100%',
                        minHeight: '600px',
                        border: 'none',
                        background: 'white',
                      }}
                      title={`Email preview: ${type}`}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ),
        )}
      </Tabs>
    </div>
  );
}
