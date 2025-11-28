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
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('workspaces')
@UseGuards(AuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  /**
   * GET /workspaces
   * Obtener todos los workspaces del usuario actual
   */
  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.workspacesService.findUserWorkspaces(userId);
  }

  /**
   * POST /workspaces
   * Crear un nuevo workspace
   */
  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() createWorkspaceDto: CreateWorkspaceDto
  ) {
    return this.workspacesService.create(userId, createWorkspaceDto);
  }

  /**
   * GET /workspaces/:id
   * Obtener un workspace específico
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.workspacesService.findOne(id, userId);
  }

  /**
   * PUT /workspaces/:id
   * Actualizar un workspace (solo OWNER)
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto
  ) {
    return this.workspacesService.update(id, userId, updateWorkspaceDto);
  }

  /**
   * DELETE /workspaces/:id
   * Eliminar un workspace (solo OWNER)
   */
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.workspacesService.remove(id, userId);
  }
}
