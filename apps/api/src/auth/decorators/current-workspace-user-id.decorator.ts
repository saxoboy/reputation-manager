import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentWorkspaceUserId - Extrae el WorkspaceUser.id del request
 *
 * Requiere que WorkspaceGuard se haya ejecutado primero.
 * Útil para operaciones que necesitan el ID de la membresía (ej: createdById en Campaign).
 */
export const CurrentWorkspaceUserId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.workspaceUserId;
  },
);
