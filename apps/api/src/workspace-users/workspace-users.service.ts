import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@reputation-manager/database';
import { InviteUserDto, UpdateUserRoleDto } from './dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class WorkspaceUsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Listar todos los usuarios de un workspace
   */
  async findAll(workspaceId: string) {
    const workspaceUsers = await this.prisma.workspaceUser.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return workspaceUsers.map((wu) => ({
      id: wu.id,
      role: wu.role,
      joinedAt: wu.createdAt,
      user: wu.user,
    }));
  }

  /**
   * Invitar un usuario al workspace
   * Por ahora crea la relación directamente
   * TODO: Implementar sistema de invitaciones por email
   */
  async invite(workspaceId: string, inviterId: string, dto: InviteUserDto) {
    // Verificar que el inviter sea OWNER o DOCTOR
    const inviter = await this.prisma.workspaceUser.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: inviterId,
        },
      },
    });

    if (!inviter || (inviter.role !== UserRole.OWNER && inviter.role !== UserRole.DOCTOR)) {
      throw new ForbiddenException(
        'Solo OWNER y DOCTOR pueden invitar usuarios'
      );
    }

    // No permitir que DOCTOR invite a OWNER
    if (inviter.role === UserRole.DOCTOR && dto.role === UserRole.OWNER) {
      throw new ForbiddenException('No puedes invitar un OWNER');
    }

    // Buscar usuario por email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException(
        `Usuario con email ${dto.email} no encontrado. Debe registrarse primero.`
      );
    }

    // Verificar que no esté ya en el workspace
    const existingMember = await this.prisma.workspaceUser.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('El usuario ya es miembro de este workspace');
    }

    // Crear la relación
    const workspaceUser = await this.prisma.workspaceUser.create({
      data: {
        workspaceId,
        userId: user.id,
        role: dto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return {
      id: workspaceUser.id,
      role: workspaceUser.role,
      joinedAt: workspaceUser.createdAt,
      user: workspaceUser.user,
    };
  }

  /**
   * Actualizar el rol de un usuario
   * Solo OWNER puede cambiar roles
   */
  async updateRole(
    workspaceId: string,
    targetUserId: string,
    requesterId: string,
    dto: UpdateUserRoleDto
  ) {
    // Verificar que el requester sea OWNER
    const requester = await this.prisma.workspaceUser.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: requesterId,
        },
      },
    });

    if (!requester || requester.role !== UserRole.OWNER) {
      throw new ForbiddenException('Solo OWNER puede cambiar roles');
    }

    // Verificar que el target user exista en el workspace
    const targetUser = await this.prisma.workspaceUser.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUserId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!targetUser) {
      throw new NotFoundException('Usuario no encontrado en este workspace');
    }

    // No permitir que el único OWNER cambie su propio rol
    if (targetUser.role === UserRole.OWNER && requesterId === targetUserId) {
      const ownersCount = await this.prisma.workspaceUser.count({
        where: {
          workspaceId,
          role: UserRole.OWNER,
        },
      });

      if (ownersCount === 1) {
        throw new ConflictException(
          'No puedes cambiar tu rol siendo el único OWNER. Asigna otro OWNER primero.'
        );
      }
    }

    // Actualizar el rol
    const updated = await this.prisma.workspaceUser.update({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUserId,
        },
      },
      data: {
        role: dto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      role: updated.role,
      user: updated.user,
    };
  }

  /**
   * Remover un usuario del workspace
   * OWNER puede remover a cualquiera
   * DOCTOR puede remover a RECEPTIONIST
   * Usuarios pueden removerse a sí mismos (salir del workspace)
   */
  async remove(
    workspaceId: string,
    targetUserId: string,
    requesterId: string
  ) {
    // Verificar permisos del requester
    const requester = await this.prisma.workspaceUser.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: requesterId,
        },
      },
    });

    if (!requester) {
      throw new ForbiddenException('No tienes acceso a este workspace');
    }

    // Verificar que el target exista
    const target = await this.prisma.workspaceUser.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUserId,
        },
      },
    });

    if (!target) {
      throw new NotFoundException('Usuario no encontrado en este workspace');
    }

    // Lógica de permisos
    const isSelf = requesterId === targetUserId;
    const isOwner = requester.role === UserRole.OWNER;
    const isDoctor = requester.role === UserRole.DOCTOR;
    const targetIsReceptionist = target.role === UserRole.RECEPTIONIST;

    if (!isSelf && !isOwner && !(isDoctor && targetIsReceptionist)) {
      throw new ForbiddenException(
        'No tienes permisos para remover este usuario'
      );
    }

    // No permitir que el único OWNER se remueva
    if (target.role === UserRole.OWNER && isSelf) {
      const ownersCount = await this.prisma.workspaceUser.count({
        where: {
          workspaceId,
          role: UserRole.OWNER,
        },
      });

      if (ownersCount === 1) {
        throw new ConflictException(
          'No puedes salir siendo el único OWNER. Asigna otro OWNER primero o elimina el workspace.'
        );
      }
    }

    // Remover usuario
    await this.prisma.workspaceUser.delete({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUserId,
        },
      },
    });

    return {
      message: isSelf
        ? 'Has salido del workspace exitosamente'
        : 'Usuario removido exitosamente',
    };
  }
}
