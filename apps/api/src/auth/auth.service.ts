import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@reputation-manager/database';
import { auth } from './auth.config';
import { RegisterDto } from './dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registra un nuevo usuario y crea un workspace por defecto
   */
  async register(dto: RegisterDto) {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ConflictException('El email ya está registrado');
      }

      // Better Auth maneja la creación del usuario
      const result = await auth.api.signUpEmail({
        body: {
          email: dto.email,
          password: dto.password,
          name: dto.name,
        },
      });

      if (!result || !result.user) {
        throw new InternalServerErrorException('Error al crear usuario');
      }

      const userId = result.user.id;

      // Crear workspace por defecto para el nuevo usuario
      const workspace = await this.prisma.workspace.create({
        data: {
          name: `Workspace de ${dto.name}`,
          plan: 'FREE',
          messageCredits: 50,
          users: {
            create: {
              userId,
              role: UserRole.OWNER,
            },
          },
        },
      });

      return {
        user: result.user,
        workspace,
        token: result.token,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      console.error('Error en register:', error);
      throw new InternalServerErrorException('Error al registrar usuario');
    }
  }

  /**
   * Obtiene la sesión actual del usuario
   */
  async getSession(headers: Record<string, string>) {
    try {
      const session = await auth.api.getSession({ headers });
      
      if (!session || !session.user) {
        throw new UnauthorizedException('No autenticado');
      }

      // Obtener workspaces del usuario
      const workspaces = await this.prisma.workspaceUser.findMany({
        where: { userId: session.user.id },
        include: {
          workspace: true,
        },
      });

      return {
        user: session.user,
        session: session.session,
        workspaces: workspaces.map(wu => ({
          ...wu.workspace,
          role: wu.role,
        })),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Sesión inválida');
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  async logout(headers: Record<string, string>) {
    try {
      await auth.api.signOut({ headers });
      return { message: 'Sesión cerrada exitosamente' };
    } catch (error) {
      console.error('Error en logout:', error);
      throw new InternalServerErrorException('Error al cerrar sesión');
    }
  }
}
