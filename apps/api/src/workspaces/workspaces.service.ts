import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@reputation-manager/database';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  UpdateWorkspaceChannelSettingsDto,
} from './dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtener todos los workspaces del usuario autenticado
   */
  async findUserWorkspaces(userId: string) {
    const workspaceUsers = await this.prisma.workspaceUser.findMany({
      where: { userId },
      include: {
        workspace: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return workspaceUsers.map((wu) => ({
      ...wu.workspace,
      role: wu.role,
      joinedAt: wu.createdAt,
    }));
  }

  /**
   * Crear un nuevo workspace
   * El usuario que lo crea automáticamente es OWNER
   */
  async create(userId: string, dto: CreateWorkspaceDto) {
    const workspace = await this.prisma.workspace.create({
      data: {
        name: dto.name,
        plan: dto.plan ?? 'FREE',
        messageCredits: 50,
        users: {
          create: {
            userId,
            role: UserRole.OWNER,
          },
        },
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return workspace;
  }

  /**
   * Obtener un workspace por ID
   * Verifica que el usuario tenga acceso
   */
  async findOne(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        practices: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace no encontrado');
    }

    // Verificar que el usuario tenga acceso
    const userAccess = workspace.users.find((u) => u.userId === userId);
    if (!userAccess) {
      throw new ForbiddenException('No tienes acceso a este workspace');
    }

    return {
      ...workspace,
      userRole: userAccess.role,
    };
  }

  /**
   * Actualizar workspace
   * Solo OWNER puede actualizar
   */
  async update(workspaceId: string, userId: string, dto: UpdateWorkspaceDto) {
    // Verificar que el usuario sea OWNER
    const workspaceUser = await this.prisma.workspaceUser.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!workspaceUser) {
      throw new ForbiddenException('No tienes acceso a este workspace');
    }

    if (workspaceUser.role !== UserRole.OWNER) {
      throw new ForbiddenException(
        'Solo el OWNER puede actualizar el workspace',
      );
    }

    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: dto,
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return workspace;
  }

  /**
   * Eliminar workspace (soft delete)
   * Solo OWNER puede eliminar
   */
  async remove(workspaceId: string, userId: string) {
    // Verificar que el usuario sea OWNER
    const workspaceUser = await this.prisma.workspaceUser.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!workspaceUser) {
      throw new ForbiddenException('No tienes acceso a este workspace');
    }

    if (workspaceUser.role !== UserRole.OWNER) {
      throw new ForbiddenException('Solo el OWNER puede eliminar el workspace');
    }

    // Verificar que no haya otros usuarios
    const usersCount = await this.prisma.workspaceUser.count({
      where: { workspaceId },
    });

    if (usersCount > 1) {
      throw new ConflictException(
        'No puedes eliminar un workspace con otros usuarios. Remuévelos primero.',
      );
    }

    // Eliminar workspace (cascade eliminará workspace_users, practices, etc)
    await this.prisma.workspace.delete({
      where: { id: workspaceId },
    });

    return {
      message: 'Workspace eliminado exitosamente',
    };
  }

  /**
   * Actualizar configuración de canales de mensajería
   * Solo OWNER puede actualizar
   */
  async updateChannelSettings(
    workspaceId: string,
    userId: string,
    dto: UpdateWorkspaceChannelSettingsDto,
  ) {
    // Verificar que el usuario sea OWNER
    const workspaceUser = await this.prisma.workspaceUser.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!workspaceUser) {
      throw new ForbiddenException('No tienes acceso a este workspace');
    }

    if (workspaceUser.role !== UserRole.OWNER) {
      throw new ForbiddenException(
        'Solo el OWNER puede actualizar la configuración de canales',
      );
    }

    // Obtener workspace actual para validaciones
    const currentWorkspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        smsEnabled: true,
        whatsappEnabled: true,
        emailEnabled: true,
        defaultChannel: true,
      },
    });

    if (!currentWorkspace) {
      throw new NotFoundException('Workspace no encontrado');
    }

    // Validar que al menos un canal quede habilitado
    const smsEnabled = dto.smsEnabled ?? currentWorkspace.smsEnabled;
    const whatsappEnabled =
      dto.whatsappEnabled ?? currentWorkspace.whatsappEnabled;
    const emailEnabled = dto.emailEnabled ?? currentWorkspace.emailEnabled;

    if (!smsEnabled && !whatsappEnabled && !emailEnabled) {
      throw new BadRequestException(
        'Al menos un canal debe estar habilitado (SMS, WhatsApp o Email)',
      );
    }

    // Validar que el canal por defecto esté habilitado
    const defaultChannel =
      dto.defaultChannel ?? currentWorkspace.defaultChannel;

    if (defaultChannel === 'SMS' && !smsEnabled) {
      throw new BadRequestException(
        'No puedes establecer SMS como canal por defecto si está deshabilitado',
      );
    }

    if (defaultChannel === 'WHATSAPP' && !whatsappEnabled) {
      throw new BadRequestException(
        'No puedes establecer WhatsApp como canal por defecto si está deshabilitado',
      );
    }

    if (defaultChannel === 'EMAIL' && !emailEnabled) {
      throw new BadRequestException(
        'No puedes establecer Email como canal por defecto si está deshabilitado',
      );
    }

    // Actualizar configuración
    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: dto,
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return workspace;
  }
}
