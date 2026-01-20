import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  NotFoundException,
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
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ) {
    return this.workspacesService.create(userId, createWorkspaceDto);
  }

  /**
   * GET /workspaces/current
   * Obtener el workspace actual (el primero/último usado)
   * IMPORTANTE: Debe ir ANTES de :id para no ser interpretado como un ID
   */
  @Get('current')
  async findCurrent(@CurrentUser('id') userId: string) {
    const workspaces = await this.workspacesService.findUserWorkspaces(userId);
    if (!workspaces || workspaces.length === 0) {
      throw new NotFoundException(
        'No se encontraron workspaces para este usuario',
      );
    }
    // Devolver el primero (más reciente según la query en service)
    return workspaces[0];
  }

  /**
   * GET /workspaces/:id
   * Obtener un workspace específico
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
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
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(id, userId, updateWorkspaceDto);
  }

  /**
   * DELETE /workspaces/:id
   * Eliminar un workspace (solo OWNER)
   */
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.workspacesService.remove(id, userId);
  }
}
