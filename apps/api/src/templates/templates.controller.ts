import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RoleGuard, Roles } from '../auth/guards/role.guard';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';
import { UserRole } from '@prisma/client';

@Controller('workspaces/:workspaceId/templates')
@UseGuards(AuthGuard, WorkspaceGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  /**
   * GET /workspaces/:workspaceId/templates
   * Listar todos los templates del workspace
   */
  @Get()
  async findAll(@CurrentWorkspace('id') workspaceId: string) {
    return this.templatesService.findAll(workspaceId);
  }

  /**
   * POST /workspaces/:workspaceId/templates
   * Crear un nuevo template (OWNER y DOCTOR pueden crear)
   */
  @Post()
  @UseGuards(RoleGuard)
  @Roles(UserRole.OWNER, UserRole.DOCTOR)
  async create(
    @CurrentWorkspace('id') workspaceId: string,
    @Body() createTemplateDto: CreateTemplateDto,
  ) {
    return this.templatesService.create(workspaceId, createTemplateDto);
  }

  /**
   * GET /workspaces/:workspaceId/templates/:id
   * Obtener un template específico
   */
  @Get(':id')
  async findOne(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.templatesService.findOne(id, workspaceId);
  }

  /**
   * PUT /workspaces/:workspaceId/templates/:id
   * Actualizar un template (OWNER y DOCTOR pueden actualizar)
   */
  @Put(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.OWNER, UserRole.DOCTOR)
  async update(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    return this.templatesService.update(id, workspaceId, updateTemplateDto);
  }

  /**
   * DELETE /workspaces/:workspaceId/templates/:id
   * Eliminar un template (Solo OWNER puede eliminar)
   */
  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.OWNER)
  async remove(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.templatesService.remove(id, workspaceId);
  }

  /**
   * POST /workspaces/:workspaceId/templates/:id/duplicate
   * Duplicar un template
   */
  @Post(':id/duplicate')
  @UseGuards(RoleGuard)
  @Roles(UserRole.OWNER, UserRole.DOCTOR)
  async duplicate(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.templatesService.duplicate(id, workspaceId);
  }
}
