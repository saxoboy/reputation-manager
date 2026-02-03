import { Injectable } from '@nestjs/common';
import { createObjectCsvWriter } from 'csv-writer';
import PDFDocument from 'pdfkit';

export interface ExportData {
  workspaceName: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  metrics: {
    totalMessages: number;
    totalResponses: number;
    responseRate: number;
    averageRating: number;
    npsScore: number;
  };
  campaigns: Array<{
    name: string;
    messagesSent: number;
    responses: number;
    responseRate: number;
    averageRating: number;
  }>;
  ratingDistribution: Record<string, number>;
  sentiment: {
    happy: number;
    neutral: number;
    unhappy: number;
  };
}

@Injectable()
export class ExportService {
  /**
   * Genera CSV con datos de analytics
   */
  async generateCsv(data: ExportData): Promise<string> {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `/tmp/analytics-${data.workspaceName}-${timestamp}.csv`;

    const csvWriter = createObjectCsvWriter({
      path: filename,
      header: [
        { id: 'metric', title: 'Métrica' },
        { id: 'value', title: 'Valor' },
      ],
    });

    const records = [
      {
        metric: 'Workspace',
        value: data.workspaceName,
      },
      {
        metric: 'Fecha de reporte',
        value: new Date().toLocaleDateString('es-EC'),
      },
      ...(data.dateRange
        ? [
            {
              metric: 'Rango de fechas',
              value: `${data.dateRange.from.toLocaleDateString('es-EC')} - ${data.dateRange.to.toLocaleDateString('es-EC')}`,
            },
          ]
        : []),
      { metric: '', value: '' },
      { metric: '=== MÉTRICAS PRINCIPALES ===', value: '' },
      {
        metric: 'Mensajes Enviados',
        value: data.metrics.totalMessages.toString(),
      },
      {
        metric: 'Respuestas Recibidas',
        value: data.metrics.totalResponses.toString(),
      },
      {
        metric: 'Tasa de Respuesta',
        value: `${data.metrics.responseRate.toFixed(1)}%`,
      },
      {
        metric: 'Rating Promedio',
        value: data.metrics.averageRating.toFixed(2),
      },
      { metric: 'NPS Score', value: data.metrics.npsScore.toString() },
      { metric: '', value: '' },
      { metric: '=== SENTIMIENTO ===', value: '' },
      {
        metric: 'Pacientes Felices (4-5⭐)',
        value: data.sentiment.happy.toString(),
      },
      {
        metric: 'Pacientes Neutrales (3⭐)',
        value: data.sentiment.neutral.toString(),
      },
      {
        metric: 'Pacientes Infelices (1-2⭐)',
        value: data.sentiment.unhappy.toString(),
      },
      { metric: '', value: '' },
      { metric: '=== DISTRIBUCIÓN DE RATINGS ===', value: '' },
      {
        metric: '5 Estrellas',
        value: data.ratingDistribution['5']?.toString() || '0',
      },
      {
        metric: '4 Estrellas',
        value: data.ratingDistribution['4']?.toString() || '0',
      },
      {
        metric: '3 Estrellas',
        value: data.ratingDistribution['3']?.toString() || '0',
      },
      {
        metric: '2 Estrellas',
        value: data.ratingDistribution['2']?.toString() || '0',
      },
      {
        metric: '1 Estrella',
        value: data.ratingDistribution['1']?.toString() || '0',
      },
      { metric: '', value: '' },
      { metric: '=== TOP CAMPAÑAS ===', value: '' },
      ...data.campaigns.map((campaign) => ({
        metric: campaign.name,
        value: `${campaign.messagesSent} mensajes | ${campaign.responses} respuestas | ${campaign.responseRate.toFixed(1)}% | ⭐ ${campaign.averageRating.toFixed(2)}`,
      })),
    ];

    await csvWriter.writeRecords(records);
    return filename;
  }

  /**
   * Genera PDF con datos de analytics
   */
  async generatePdf(data: ExportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Reporte de Analytics', { align: 'center' });

      doc.moveDown();
      doc
        .fontSize(12)
        .font('Helvetica')
        .text(`Workspace: ${data.workspaceName}`, { align: 'center' });

      doc
        .fontSize(10)
        .text(`Generado: ${new Date().toLocaleDateString('es-EC')}`, {
          align: 'center',
        });

      if (data.dateRange) {
        doc.text(
          `Período: ${data.dateRange.from.toLocaleDateString('es-EC')} - ${data.dateRange.to.toLocaleDateString('es-EC')}`,
          { align: 'center' },
        );
      }

      doc.moveDown(2);

      // Métricas principales
      doc.fontSize(16).font('Helvetica-Bold').text('Métricas Principales');
      doc.moveDown(0.5);

      const metrics = [
        ['Mensajes Enviados', data.metrics.totalMessages.toLocaleString()],
        ['Respuestas Recibidas', data.metrics.totalResponses.toLocaleString()],
        ['Tasa de Respuesta', `${data.metrics.responseRate.toFixed(1)}%`],
        ['Rating Promedio', `${data.metrics.averageRating.toFixed(2)} / 5.0`],
        ['NPS Score', data.metrics.npsScore.toString()],
      ];

      doc.fontSize(11).font('Helvetica');
      metrics.forEach(([label, value]) => {
        doc
          .text(`${label}: `, { continued: true })
          .font('Helvetica-Bold')
          .text(value);
      });

      doc.moveDown(1.5);

      // Sentimiento
      doc.fontSize(16).font('Helvetica-Bold').text('Análisis de Sentimiento');
      doc.moveDown(0.5);

      const total =
        data.sentiment.happy + data.sentiment.neutral + data.sentiment.unhappy;
      const sentimentData = [
        [
          'Felices (4-5⭐)',
          data.sentiment.happy.toString(),
          total > 0
            ? `${((data.sentiment.happy / total) * 100).toFixed(1)}%`
            : '0%',
        ],
        [
          'Neutrales (3⭐)',
          data.sentiment.neutral.toString(),
          total > 0
            ? `${((data.sentiment.neutral / total) * 100).toFixed(1)}%`
            : '0%',
        ],
        [
          'Infelices (1-2⭐)',
          data.sentiment.unhappy.toString(),
          total > 0
            ? `${((data.sentiment.unhappy / total) * 100).toFixed(1)}%`
            : '0%',
        ],
      ];

      doc.fontSize(11).font('Helvetica');
      sentimentData.forEach(([label, count, percentage]) => {
        doc
          .text(`${label}: `, { continued: true })
          .font('Helvetica-Bold')
          .text(`${count} `, { continued: true })
          .font('Helvetica')
          .text(`(${percentage})`);
      });

      doc.moveDown(1.5);

      // Distribución de ratings
      doc.fontSize(16).font('Helvetica-Bold').text('Distribución de Ratings');
      doc.moveDown(0.5);

      doc.fontSize(11).font('Helvetica');
      for (let i = 5; i >= 1; i--) {
        const count = data.ratingDistribution[i.toString()] || 0;
        doc
          .text(`${'⭐'.repeat(i)}: `, { continued: true })
          .font('Helvetica-Bold')
          .text(count.toString());
      }

      // Top campañas (si hay espacio)
      if (data.campaigns.length > 0) {
        doc.moveDown(1.5);
        doc.fontSize(16).font('Helvetica-Bold').text('Top Campañas');
        doc.moveDown(0.5);

        doc.fontSize(10).font('Helvetica');
        data.campaigns.slice(0, 5).forEach((campaign, index) => {
          doc.font('Helvetica-Bold').text(`${index + 1}. ${campaign.name}`);
          doc
            .font('Helvetica')
            .fontSize(9)
            .text(
              `   ${campaign.messagesSent} mensajes | ${campaign.responses} respuestas | ${campaign.responseRate.toFixed(1)}% | ⭐ ${campaign.averageRating.toFixed(2)}`,
            );
          doc.moveDown(0.3);
        });
      }

      // Footer
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          'Reputation Manager - Sistema de Gestión de Feedback',
          50,
          doc.page.height - 50,
          {
            align: 'center',
          },
        );

      doc.end();
    });
  }
}
