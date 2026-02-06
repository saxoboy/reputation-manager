import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { ExportService } from './export.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';
import { PrismaService } from '@reputation-manager/database';
import { createReadStream, unlinkSync } from 'fs';

@Controller('workspaces/:workspaceId/analytics')
@UseGuards(AuthGuard, WorkspaceGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly exportService: ExportService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET /workspaces/:workspaceId/analytics
   * Obtiene analytics general del workspace
   */
  @Get()
  async getWorkspaceAnalytics(
    @CurrentWorkspace('id') workspaceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.analyticsService.getWorkspaceAnalytics(workspaceId, start, end);
  }

  /**
   * GET /workspaces/:workspaceId/analytics/campaigns/:campaignId
   * Obtiene analytics de una campaña específica
   */
  @Get('campaigns/:campaignId')
  async getCampaignAnalytics(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('campaignId') campaignId: string,
  ) {
    return this.analyticsService.getCampaignAnalytics(workspaceId, campaignId);
  }

  /**
   * GET /workspaces/:workspaceId/analytics/practices/:practiceId
   * Obtiene analytics de un practice específico
   */
  @Get('practices/:practiceId')
  async getPracticeAnalytics(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('practiceId') practiceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.analyticsService.getPracticeAnalytics(
      workspaceId,
      practiceId,
      start,
      end,
    );
  }

  /**
   * GET /workspaces/:workspaceId/analytics/export/csv
   * Exporta analytics en formato CSV
   */
  @Get('export/csv')
  async exportCsv(
    @CurrentWorkspace('id') workspaceId: string,
    @CurrentWorkspace('name') workspaceName: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    // Obtener datos
    const analytics = await this.analyticsService.getWorkspaceAnalytics(
      workspaceId,
      start,
      end,
    );

    // Preparar datos para exportación
    const exportData = {
      workspaceName,
      dateRange: start && end ? { from: start, to: end } : undefined,
      metrics: analytics.overview,
      campaigns: analytics.campaigns,
      ratingDistribution: analytics.distribution.rating,
      sentiment: analytics.distribution.sentiment,
    };

    // Generar CSV
    const filename = await this.exportService.generateCsv(exportData);

    // Enviar archivo
    const file = createReadStream(filename);
    const timestamp = new Date().toISOString().split('T')[0];

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="analytics-${workspaceName}-${timestamp}.csv"`,
    });

    file.pipe(res);

    // Limpiar archivo temporal después de enviar
    file.on('end', () => {
      unlinkSync(filename);
    });
  }

  /**
   * GET /workspaces/:workspaceId/analytics/export/pdf
   * Exporta analytics en formato PDF
   */
  @Get('export/pdf')
  async exportPdf(
    @CurrentWorkspace('id') workspaceId: string,
    @CurrentWorkspace('name') workspaceName: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    // Obtener datos
    const analytics = await this.analyticsService.getWorkspaceAnalytics(
      workspaceId,
      start,
      end,
    );

    // Preparar datos para exportación
    const exportData = {
      workspaceName,
      dateRange: start && end ? { from: start, to: end } : undefined,
      metrics: analytics.overview,
      campaigns: analytics.campaigns,
      ratingDistribution: analytics.distribution.rating,
      sentiment: analytics.distribution.sentiment,
    };

    // Generar PDF
    const pdfBuffer = await this.exportService.generatePdf(exportData);

    const timestamp = new Date().toISOString().split('T')[0];

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="analytics-${workspaceName}-${timestamp}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  // ═══════════════════════════════════════════════════════
  // Comparison Analytics
  // ═══════════════════════════════════════════════════════

  /**
   * GET /workspaces/:workspaceId/analytics/compare/practices?ids=id1,id2
   * Compara métricas entre múltiples practices
   */
  @Get('compare/practices')
  async comparePractices(
    @CurrentWorkspace('id') workspaceId: string,
    @Query('ids') ids: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!ids) {
      throw new BadRequestException(
        'Parameter "ids" is required (comma-separated practice IDs)',
      );
    }

    const practiceIds = ids.split(',').map((id) => id.trim());
    if (practiceIds.length < 2) {
      throw new BadRequestException('At least 2 practice IDs are required');
    }

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.analyticsService.comparePractices(
      workspaceId,
      practiceIds,
      start,
      end,
    );
  }

  /**
   * GET /workspaces/:workspaceId/analytics/compare/campaigns?ids=id1,id2
   * Compara métricas entre múltiples campaigns
   */
  @Get('compare/campaigns')
  async compareCampaigns(
    @CurrentWorkspace('id') workspaceId: string,
    @Query('ids') ids: string,
  ) {
    if (!ids) {
      throw new BadRequestException(
        'Parameter "ids" is required (comma-separated campaign IDs)',
      );
    }

    const campaignIds = ids.split(',').map((id) => id.trim());
    if (campaignIds.length < 2) {
      throw new BadRequestException('At least 2 campaign IDs are required');
    }

    return this.analyticsService.compareCampaigns(workspaceId, campaignIds);
  }

  /**
   * GET /workspaces/:workspaceId/analytics/compare/periods
   * Compara dos períodos de tiempo
   */
  @Get('compare/periods')
  async comparePeriods(
    @CurrentWorkspace('id') workspaceId: string,
    @Query('period1Start') period1Start: string,
    @Query('period1End') period1End: string,
    @Query('period2Start') period2Start: string,
    @Query('period2End') period2End: string,
  ) {
    if (!period1Start || !period1End || !period2Start || !period2End) {
      throw new BadRequestException(
        'All period parameters are required: period1Start, period1End, period2Start, period2End',
      );
    }

    return this.analyticsService.comparePeriods(
      workspaceId,
      new Date(period1Start),
      new Date(period1End),
      new Date(period2Start),
      new Date(period2End),
    );
  }

  // ═══════════════════════════════════════════════════════
  // Cohort Analysis
  // ═══════════════════════════════════════════════════════

  /**
   * GET /workspaces/:workspaceId/analytics/cohorts
   * Análisis de cohortes mensuales
   */
  @Get('cohorts')
  async getCohortAnalysis(
    @CurrentWorkspace('id') workspaceId: string,
    @Query('months') months?: string,
  ) {
    const monthCount = months ? parseInt(months, 10) : 6;
    return this.analyticsService.getCohortAnalysis(
      workspaceId,
      Math.min(Math.max(monthCount, 2), 24),
    );
  }

  /**
   * GET /workspaces/:workspaceId/analytics/trends
   * Tendencias de response rate a lo largo del tiempo
   */
  @Get('trends')
  async getResponseRateTrends(
    @CurrentWorkspace('id') workspaceId: string,
    @Query('months') months?: string,
  ) {
    const monthCount = months ? parseInt(months, 10) : 12;
    return this.analyticsService.getResponseRateTrends(
      workspaceId,
      Math.min(Math.max(monthCount, 2), 24),
    );
  }
}
