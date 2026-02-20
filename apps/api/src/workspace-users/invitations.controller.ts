import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { WorkspaceUsersService } from './workspace-users.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly workspaceUsersService: WorkspaceUsersService) {}

  /**
   * GET /invitations/:token
   * Info pública de una invitación (sin auth)
   */
  @Get(':token')
  @AllowAnonymous()
  async getByToken(@Param('token') token: string) {
    return this.workspaceUsersService.getInvitationByToken(token);
  }

  /**
   * POST /invitations/:token/accept
   * Aceptar una invitación (requiere auth)
   */
  @Post(':token/accept')
  @UseGuards(AuthGuard)
  async accept(
    @Param('token') token: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspaceUsersService.acceptInvitation(token, userId);
  }
}
