import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * RoleGuard - Verifica que el usuario tenga uno de los roles requeridos
 *
 * Requiere que AuthGuard y WorkspaceGuard se ejecuten primero.
 *
 * Uso:
 * @UseGuards(AuthGuard, WorkspaceGuard, RoleGuard)
 * @Roles(UserRole.OWNER, UserRole.DOCTOR)
 * @Post('campaigns')
 * async createCampaign(...) { ... }
 */
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No se requieren roles específicos
    }

    const request = context.switchToHttp().getRequest<Request>();
    const userRole = request['workspaceRole'] as UserRole;

    if (!userRole) {
      throw new ForbiddenException(
        'WorkspaceGuard debe ejecutarse antes de RoleGuard',
      );
    }

    const hasRole = requiredRoles.includes(userRole);

    if (!hasRole) {
      throw new ForbiddenException(
        `Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
