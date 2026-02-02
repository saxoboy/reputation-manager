import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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

  /**
   * GET /workspaces/:workspaceId/practices/search/google-places
   * Buscar consultorios en Google Places
   * Rate limit: 20 peticiones por minuto
   */
  @Get('search/google-places')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async searchGooglePlaces(
    @Query('query') query: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    const location =
      lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined;
    return this.practicesService.searchGooglePlaces(query, location);
  }

  /**
   * GET /workspaces/:workspaceId/practices/google-places/:placeId
   * Obtener detalles de un lugar de Google Places por Place ID
   * Rate limit: 20 peticiones por minuto
   */
  @Get('google-places/:placeId')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getGooglePlaceDetails(@Param('placeId') placeId: string) {
    return this.practicesService.getGooglePlaceDetails(placeId);
  }

  /**
   * GET /workspaces/:workspaceId/practices/autocomplete/google-places
   * Autocompletar búsqueda de lugares
   * Rate limit: 20 peticiones por minuto
   */
  @Get('autocomplete/google-places')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async autocompleteGooglePlaces(
    @Query('input') input: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    const location =
      lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined;
    return this.practicesService.autocompleteGooglePlaces(input, location);
  }
}
