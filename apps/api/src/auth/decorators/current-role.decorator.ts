import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/**
 * CurrentRole Decorator - Extrae el rol del usuario en el workspace actual
 *
 * Requiere que WorkspaceGuard se haya ejecutado primero.
 *
 * Uso:
 * @Get('workspaces/:workspaceId/my-role')
 * async getMyRole(@CurrentRole() role: UserRole) {
 *   return { role };
 * }
 */
export const CurrentRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserRole | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.workspaceRole || null;
  }
);
