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
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto } from './dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RoleGuard, Roles } from '../auth/guards/role.guard';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';
import { UserRole } from '@prisma/client';

@Controller('workspaces/:workspaceId/patients')
@UseGuards(AuthGuard, WorkspaceGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  /**
   * GET /workspaces/:workspaceId/patients
   * Listar todos los pacientes del workspace con filtros opcionales
   */
  @Get()
  async findAll(
    @CurrentWorkspace('id') workspaceId: string,
    @Query('campaignId') campaignId?: string,
    @Query('hasConsent') hasConsent?: string,
    @Query('optedOut') optedOut?: string,
  ) {
    return this.patientsService.findAll(workspaceId, {
      campaignId,
      hasConsent: hasConsent === 'true',
      optedOut: optedOut === 'true',
    });
  }

  /**
   * GET /workspaces/:workspaceId/patients/stats
   * Obtener estadísticas de pacientes
   */
  @Get('stats')
  async getStats(@CurrentWorkspace('id') workspaceId: string) {
    return this.patientsService.getStats(workspaceId);
  }

  /**
   * GET /workspaces/:workspaceId/patients/:id
   * Obtener un paciente específico
   */
  @Get(':id')
  async findOne(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.patientsService.findOne(id, workspaceId);
  }

  /**
   * POST /workspaces/:workspaceId/patients
   * Crear un nuevo paciente (OWNER, DOCTOR, RECEPTIONIST pueden crear)
   */
  @Post()
  @UseGuards(RoleGuard)
  @Roles(UserRole.OWNER, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  async create(
    @CurrentWorkspace('id') workspaceId: string,
    @Body() createPatientDto: CreatePatientDto,
  ) {
    return this.patientsService.create(workspaceId, createPatientDto);
  }

  /**
   * PUT /workspaces/:workspaceId/patients/:id
   * Actualizar un paciente (OWNER, DOCTOR, RECEPTIONIST pueden actualizar)
   */
  @Put(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.OWNER, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  async update(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    return this.patientsService.update(id, workspaceId, updatePatientDto);
  }

  /**
   * DELETE /workspaces/:workspaceId/patients/:id
   * Soft delete de un paciente (OWNER y DOCTOR pueden eliminar)
   */
  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.OWNER, UserRole.DOCTOR)
  async remove(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.patientsService.remove(id, workspaceId);
  }

  /**
   * POST /workspaces/:workspaceId/patients/:id/opt-out
   * Marcar paciente como opted-out (no enviar más mensajes)
   */
  @Post(':id/opt-out')
  async optOut(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.patientsService.optOut(id, workspaceId);
  }
}

/**
 * Controller adicional para obtener pacientes por campaña
 */
@Controller('workspaces/:workspaceId/campaigns/:campaignId/patients')
@UseGuards(AuthGuard, WorkspaceGuard)
export class CampaignPatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  /**
   * GET /workspaces/:workspaceId/campaigns/:campaignId/patients
   * Listar todos los pacientes de una campaña específica
   */
  @Get()
  async findByCampaign(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('campaignId') campaignId: string,
  ) {
    return this.patientsService.findByCampaign(campaignId, workspaceId);
  }
}
