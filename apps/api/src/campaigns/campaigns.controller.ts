import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, UpdateCampaignDto, UploadCsvDto } from './dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RoleGuard, Roles } from '../auth/guards/role.guard';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';
import { CurrentWorkspaceUserId } from '../auth/decorators/current-workspace-user-id.decorator';
import { UserRole } from '@prisma/client';

@Controller('workspaces/:workspaceId/campaigns')
@UseGuards(AuthGuard, WorkspaceGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  /**
   * GET /workspaces/:workspaceId/campaigns
   * Listar todas las campañas del workspace
   */
  @Get()
  async findAll(@CurrentWorkspace('id') workspaceId: string) {
    return this.campaignsService.findAll(workspaceId);
  }

  /**
   * POST /workspaces/:workspaceId/campaigns
   * Crear una nueva campaña (OWNER y DOCTOR pueden crear)
   */
  @Post()
  @UseGuards(RoleGuard)
  @Roles(UserRole.OWNER, UserRole.DOCTOR)
  async create(
    @CurrentWorkspace('id') workspaceId: string,
    @CurrentWorkspaceUserId() workspaceUserId: string,
    @Body() createCampaignDto: CreateCampaignDto,
  ) {
    return this.campaignsService.create(
      workspaceId,
      workspaceUserId,
      createCampaignDto,
    );
  }

  /**
   * GET /workspaces/:workspaceId/campaigns/:id
   * Obtener una campaña específica
   */
  @Get(':id')
  async findOne(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.campaignsService.findOne(id, workspaceId);
  }

  /**
   * PUT /workspaces/:workspaceId/campaigns/:id
   * Actualizar una campaña (OWNER y DOCTOR pueden actualizar)
   */
  @Put(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.OWNER, UserRole.DOCTOR)
  async update(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(id, workspaceId, updateCampaignDto);
  }

  /**
   * DELETE /workspaces/:workspaceId/campaigns/:id
   * Eliminar una campaña (Solo OWNER puede eliminar)
   */
  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.OWNER)
  async remove(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.campaignsService.remove(id, workspaceId);
  }

  /**
   * POST /workspaces/:workspaceId/campaigns/:id/upload
   * Upload CSV de pacientes para una campaña
   */
  @Post(':id/upload')
  @UseGuards(RoleGuard)
  @Roles(UserRole.OWNER, UserRole.DOCTOR)
  async uploadCsv(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('id') id: string,
    @Body() uploadDto: UploadCsvDto,
  ) {
    return this.campaignsService.uploadCsv(id, workspaceId, uploadDto);
  }

  /**
   * GET /workspaces/:workspaceId/campaigns/:id/export
   * Exportar datos de una campaña específica en formato CSV
   */
  @Get(':id/export')
  async exportCampaign(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('id') campaignId: string,
    @Res() res: Response,
  ) {
    const csvContent = await this.campaignsService.exportCampaignCsv(
      campaignId,
      workspaceId,
    );

    const campaign = await this.campaignsService.findOne(
      campaignId,
      workspaceId,
    );
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `campaign-${campaign.name.replace(/\s+/g, '-')}-${timestamp}.csv`;

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    res.send(csvContent);
  }
}
