import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '@reputation-manager/database';

/**
 * WorkspaceGuard - Verifica que el usuario tenga acceso al workspace
 * 
 * Requiere que AuthGuard se ejecute primero.
 * Lee el workspaceId de los params, query o body.
 * 
 * Uso:
 * @UseGuards(AuthGuard, WorkspaceGuard)
 * @Get('workspaces/:workspaceId/campaigns')
 * async getCampaigns(@CurrentWorkspace() workspace: Workspace) { ... }
 */
@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'];

    if (!user) {
      throw new ForbiddenException(
        'AuthGuard debe ejecutarse antes de WorkspaceGuard'
      );
    }

    // Buscar workspaceId en params, query o body
    const workspaceId =
      request.params?.workspaceId ||
      (request.query?.workspaceId as string) ||
      request.body?.workspaceId;

    if (!workspaceId) {
      throw new ForbiddenException('workspaceId es requerido');
    }

    // Verificar que el usuario pertenezca al workspace
    const workspaceUser = await this.prisma.workspaceUser.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
      include: {
        workspace: true,
      },
    });

    if (!workspaceUser) {
      throw new ForbiddenException(
        'No tienes acceso a este workspace'
      );
    }

    // Adjuntar workspace y role al request
    request['workspace'] = workspaceUser.workspace;
    request['workspaceRole'] = workspaceUser.role;

    return true;
  }
}
