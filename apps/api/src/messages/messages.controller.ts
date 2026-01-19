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
import { MessagesService } from './messages.service';
import { CreateMessageDto, UpdateMessageDto, SimulateResponseDto } from './dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RoleGuard, Roles } from '../auth/guards/role.guard';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';
import { UserRole, MessageStatus } from '@prisma/client';

@Controller('workspaces/:workspaceId/messages')
@UseGuards(AuthGuard, WorkspaceGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * GET /workspaces/:workspaceId/messages
   * Listar todos los mensajes del workspace con filtros opcionales
   */
  @Get()
  async findAll(
    @CurrentWorkspace('id') workspaceId: string,
    @Query('campaignId') campaignId?: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: MessageStatus,
    @Query('type') type?: string,
  ) {
    return this.messagesService.findAll(workspaceId, {
      campaignId,
      patientId,
      status,
      type,
    });
  }

  /**
   * GET /workspaces/:workspaceId/messages/stats
   * Obtener estadísticas de mensajes
   */
  @Get('stats')
  async getStats(@CurrentWorkspace('id') workspaceId: string) {
    return this.messagesService.getStats(workspaceId);
  }

  /**
   * GET /workspaces/:workspaceId/messages/:id
   * Obtener un mensaje específico
   */
  @Get(':id')
  async findOne(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.messagesService.findOne(id, workspaceId);
  }

  /**
   * POST /workspaces/:workspaceId/messages
   * Crear un nuevo mensaje (MOCK - sin envío real)
   */
  @Post()
  @UseGuards(RoleGuard)
  @Roles(UserRole.OWNER, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  async create(
    @CurrentWorkspace('id') workspaceId: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.messagesService.create(workspaceId, createMessageDto);
  }

  /**
   * PUT /workspaces/:workspaceId/messages/:id
   * Actualizar un mensaje
   */
  @Put(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.OWNER, UserRole.DOCTOR)
  async update(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
    return this.messagesService.update(id, workspaceId, updateMessageDto);
  }

  /**
   * DELETE /workspaces/:workspaceId/messages/:id
   * Eliminar un mensaje
   */
  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.OWNER, UserRole.DOCTOR)
  async remove(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.messagesService.remove(id, workspaceId);
  }

  /**
   * POST /workspaces/:workspaceId/messages/:id/response
   * Simular respuesta de un paciente (para testing)
   */
  @Post(':id/response')
  async simulateResponse(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('id') id: string,
    @Body() simulateResponseDto: SimulateResponseDto,
  ) {
    return this.messagesService.simulateResponse(
      id,
      workspaceId,
      simulateResponseDto,
    );
  }
}

/**
 * Controller adicional para obtener mensajes por campaña
 */
@Controller('workspaces/:workspaceId/campaigns/:campaignId/messages')
@UseGuards(AuthGuard, WorkspaceGuard)
export class CampaignMessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * GET /workspaces/:workspaceId/campaigns/:campaignId/messages
   * Listar todos los mensajes de una campaña específica
   */
  @Get()
  async findByCampaign(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('campaignId') campaignId: string,
  ) {
    return this.messagesService.findByCampaign(campaignId, workspaceId);
  }
}

/**
 * Controller adicional para obtener mensajes por paciente
 */
@Controller('workspaces/:workspaceId/patients/:patientId/messages')
@UseGuards(AuthGuard, WorkspaceGuard)
export class PatientMessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * GET /workspaces/:workspaceId/patients/:patientId/messages
   * Listar todos los mensajes de un paciente específico
   */
  @Get()
  async findByPatient(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('patientId') patientId: string,
  ) {
    return this.messagesService.findByPatient(patientId, workspaceId);
  }
}
