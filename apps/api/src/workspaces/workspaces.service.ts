import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@reputation-manager/database';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './dto';
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
        plan: 'FREE',
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
        'Solo el OWNER puede actualizar el workspace'
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
        'No puedes eliminar un workspace con otros usuarios. Remuévelos primero.'
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
}
