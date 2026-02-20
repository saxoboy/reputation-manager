import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@reputation-manager/database';
import { EmailService } from '@reputation-manager/integrations';
import { InviteUserDto, UpdateUserRoleDto } from './dto';
import { UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WorkspaceUsersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

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
      userId: wu.userId,
      role: wu.role,
      joinedAt: wu.createdAt,
      user: wu.user,
    }));
  }

  /**
   * Invitar un usuario al workspace.
   * - Si ya tiene cuenta: se agrega directamente.
   * - Si no tiene cuenta: se crea una invitación y se envía email.
   */
  async invite(workspaceId: string, inviterId: string, dto: InviteUserDto) {
    // Verificar que el inviter sea OWNER o DOCTOR y obtener su info
    const inviter = await this.prisma.workspaceUser.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: inviterId } },
      include: { user: { select: { name: true, email: true } } },
    });

    if (
      !inviter ||
      (inviter.role !== UserRole.OWNER && inviter.role !== UserRole.DOCTOR)
    ) {
      throw new ForbiddenException(
        'Solo OWNER y DOCTOR pueden invitar usuarios',
      );
    }

    if (inviter.role === UserRole.DOCTOR && dto.role === UserRole.OWNER) {
      throw new ForbiddenException('No puedes invitar un OWNER');
    }

    // Obtener nombre del workspace
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });

    // Buscar si el usuario ya tiene cuenta
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      // Ya tiene cuenta: verificar que no sea miembro
      const existingMember = await this.prisma.workspaceUser.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: existingUser.id } },
      });

      if (existingMember) {
        throw new ConflictException(
          'El usuario ya es miembro de este workspace',
        );
      }

      // Agregar directamente
      const workspaceUser = await this.prisma.workspaceUser.create({
        data: { workspaceId, userId: existingUser.id, role: dto.role },
        include: {
          user: { select: { id: true, email: true, name: true, image: true } },
        },
      });

      return {
        id: workspaceUser.id,
        role: workspaceUser.role,
        joinedAt: workspaceUser.createdAt,
        user: workspaceUser.user,
        invited: false,
      };
    }

    // No tiene cuenta: crear/renovar invitación pendiente
    const existingInvite = await this.prisma.invitation.findFirst({
      where: { workspaceId, email: dto.email, acceptedAt: null },
    });
    if (existingInvite) {
      await this.prisma.invitation.delete({ where: { id: existingInvite.id } });
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    await this.prisma.invitation.create({
      data: {
        workspaceId,
        email: dto.email,
        role: dto.role,
        token,
        invitedById: inviter.id,
        expiresAt,
      },
    });

    const webUrl =
      this.configService.get<string>('NEXT_PUBLIC_APP_URL') ||
      'http://localhost:4000';

    await this.emailService.sendInvitationEmail({
      email: dto.email,
      workspaceName: workspace?.name ?? 'tu equipo',
      inviterName: inviter.user?.name ?? inviter.user?.email ?? 'Un colega',
      role: dto.role,
      acceptUrl: `${webUrl}/invite/accept?token=${token}`,
    });

    return {
      invited: true,
      email: dto.email,
      role: dto.role,
      message: `Invitación enviada a ${dto.email}. El usuario recibirá un email para registrarse.`,
    };
  }

  /**
   * Aceptar una invitación (llamado desde el frontend tras el registro/login)
   */
  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: { workspace: { select: { id: true, name: true } } },
    });

    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada o ya fue usada');
    }

    if (invitation.acceptedAt) {
      throw new ConflictException('Esta invitación ya fue aceptada');
    }

    if (invitation.expiresAt < new Date()) {
      throw new ForbiddenException('Esta invitación ha expirado');
    }

    // Verificar que el user que acepta tiene el email correcto
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email !== invitation.email) {
      throw new ForbiddenException(
        'Debes iniciar sesión con el email al que fue enviada la invitación',
      );
    }

    // Verificar que no sea ya miembro
    const existingMember = await this.prisma.workspaceUser.findUnique({
      where: {
        workspaceId_userId: { workspaceId: invitation.workspaceId, userId },
      },
    });
    if (existingMember) {
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
      return { workspaceId: invitation.workspaceId, alreadyMember: true };
    }

    // Agregar al workspace y marcar invitación como aceptada
    await this.prisma.$transaction([
      this.prisma.workspaceUser.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId,
          role: invitation.role,
        },
      }),
      this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    return { workspaceId: invitation.workspaceId, alreadyMember: false };
  }

  /**
   * Obtener info de una invitación por token (endpoint público)
   */
  async getInvitationByToken(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: { workspace: { select: { name: true } } },
    });

    if (
      !invitation ||
      invitation.acceptedAt ||
      invitation.expiresAt < new Date()
    ) {
      throw new NotFoundException('Invitación no válida o expirada');
    }

    return {
      email: invitation.email,
      role: invitation.role,
      workspaceName: invitation.workspace.name,
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * Listar invitaciones pendientes de un workspace
   */
  async getPendingInvitations(workspaceId: string) {
    const invitations = await this.prisma.invitation.findMany({
      where: { workspaceId, acceptedAt: null, expiresAt: { gt: new Date() } },
      include: {
        invitedBy: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
      invitedBy:
        inv.invitedBy.user?.name ?? inv.invitedBy.user?.email ?? 'Unknown',
    }));
  }

  /**
   * Cancelar una invitación pendiente
   */
  async cancelInvitation(invitationId: string, workspaceId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.workspaceId !== workspaceId) {
      throw new NotFoundException('Invitación no encontrada');
    }

    if (invitation.acceptedAt) {
      throw new ConflictException(
        'La invitación ya fue aceptada y no se puede cancelar',
      );
    }

    await this.prisma.invitation.delete({ where: { id: invitationId } });
    return { message: 'Invitación cancelada' };
  }

  /**
   * Actualizar el rol de un usuario
   * Solo OWNER puede cambiar roles
   */
  async updateRole(
    workspaceId: string,
    targetUserId: string,
    requesterId: string,
    dto: UpdateUserRoleDto,
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
          'No puedes cambiar tu rol siendo el único OWNER. Asigna otro OWNER primero.',
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
  async remove(workspaceId: string, targetUserId: string, requesterId: string) {
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
        'No tienes permisos para remover este usuario',
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
          'No puedes salir siendo el único OWNER. Asigna otro OWNER primero o elimina el workspace.',
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
