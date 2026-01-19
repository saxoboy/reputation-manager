import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Workspace } from '@prisma/client';

/**
 * CurrentWorkspace Decorator - Extrae el workspace del request
 *
 * Requiere que WorkspaceGuard se haya ejecutado primero.
 *
 * Uso:
 * @Get('workspaces/:workspaceId/info')
 * async getWorkspaceInfo(@CurrentWorkspace() workspace: Workspace) {
 *   return workspace;
 * }
 *
 * Para obtener solo una propiedad:
 * @Get('workspaces/:workspaceId/credits')
 * async getCredits(@CurrentWorkspace('messageCredits') credits: number) {
 *   return { credits };
 * }
 */
export const CurrentWorkspace = createParamDecorator(
  (data: keyof Workspace | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const workspace = request.workspace;

    if (!workspace) {
      return null;
    }

    return data ? workspace[data] : workspace;
  },
);
