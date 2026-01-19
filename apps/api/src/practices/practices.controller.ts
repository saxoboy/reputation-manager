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
import { PracticesService } from './practices.service';
import { CreatePracticeDto, UpdatePracticeDto } from './dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RoleGuard, Roles } from '../auth/guards/role.guard';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';
import { UserRole } from '@prisma/client';

@Controller('workspaces/:workspaceId/practices')
@UseGuards(AuthGuard, WorkspaceGuard)
export class PracticesController {
  constructor(private readonly practicesService: PracticesService) {}

  /**
   * GET /workspaces/:workspaceId/practices
   * Listar todas las practices del workspace
   */
  @Get()
  async findAll(@CurrentWorkspace('id') workspaceId: string) {
    return this.practicesService.findAll(workspaceId);
  }

  /**
   * POST /workspaces/:workspaceId/practices
   * Crear una nueva practice (OWNER y DOCTOR pueden crear)
   */
  @Post()
  @UseGuards(RoleGuard)
  @Roles(UserRole.OWNER, UserRole.DOCTOR)
  async create(
    @CurrentWorkspace('id') workspaceId: string,
    @Body() createPracticeDto: CreatePracticeDto,
  ) {
    return this.practicesService.create(workspaceId, createPracticeDto);
  }

  /**
   * GET /workspaces/:workspaceId/practices/:id
   * Obtener una practice específica
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentWorkspace('id') workspaceId: string,
  ) {
    return this.practicesService.findOne(id, workspaceId);
  }

  /**
   * PUT /workspaces/:workspaceId/practices/:id
   * Actualizar una practice (OWNER y DOCTOR)
   */
  @Put(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.OWNER, UserRole.DOCTOR)
  async update(
    @Param('id') id: string,
    @CurrentWorkspace('id') workspaceId: string,
    @Body() updatePracticeDto: UpdatePracticeDto,
  ) {
    return this.practicesService.update(id, workspaceId, updatePracticeDto);
  }

  /**
   * DELETE /workspaces/:workspaceId/practices/:id
   * Eliminar una practice (solo OWNER)
   */
  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.OWNER)
  async remove(
    @Param('id') id: string,
    @CurrentWorkspace('id') workspaceId: string,
  ) {
    return this.practicesService.remove(id, workspaceId);
  }
}
