import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { WorkspaceUsersService } from './workspace-users.service';
import { InviteUserDto, UpdateUserRoleDto } from './dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RoleGuard, Roles } from '../auth/guards/role.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';
import { UserRole } from '@prisma/client';

@Controller('workspaces/:workspaceId/users')
@UseGuards(AuthGuard, WorkspaceGuard)
export class WorkspaceUsersController {
  constructor(private readonly workspaceUsersService: WorkspaceUsersService) {}

  /**
   * GET /workspaces/:workspaceId/users
   * Listar todos los usuarios del workspace
   */
  @Get()
  async findAll(@CurrentWorkspace('id') workspaceId: string) {
    return this.workspaceUsersService.findAll(workspaceId);
  }

  /**
   * POST /workspaces/:workspaceId/users/invite
   * Invitar un usuario al workspace (OWNER y DOCTOR)
   */
  @Post('invite')
  @UseGuards(RoleGuard)
  @Roles(UserRole.OWNER, UserRole.DOCTOR)
  async invite(
    @CurrentWorkspace('id') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() inviteUserDto: InviteUserDto,
  ) {
    return this.workspaceUsersService.invite(
      workspaceId,
      userId,
      inviteUserDto,
    );
  }

  /**
   * PUT /workspaces/:workspaceId/users/:userId/role
   * Cambiar el rol de un usuario (solo OWNER)
   */
  @Put(':userId/role')
  @UseGuards(RoleGuard)
  @Roles(UserRole.OWNER)
  async updateRole(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser('id') requesterId: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.workspaceUsersService.updateRole(
      workspaceId,
      targetUserId,
      requesterId,
      updateUserRoleDto,
    );
  }

  /**
   * DELETE /workspaces/:workspaceId/users/:userId
   * Remover un usuario del workspace
   * - OWNER puede remover a cualquiera
   * - DOCTOR puede remover a RECEPTIONIST
   * - Cualquiera puede removerse a sí mismo
   */
  @Delete(':userId')
  async remove(
    @CurrentWorkspace('id') workspaceId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.workspaceUsersService.remove(
      workspaceId,
      targetUserId,
      requesterId,
    );
  }
}
