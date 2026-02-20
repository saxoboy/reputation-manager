import { Module } from '@nestjs/common';
import { WorkspaceUsersController } from './workspace-users.controller';
import { InvitationsController } from './invitations.controller';
import { WorkspaceUsersService } from './workspace-users.service';
import { PrismaService } from '@reputation-manager/database';
import { EmailService } from '@reputation-manager/integrations';

@Module({
  controllers: [WorkspaceUsersController, InvitationsController],
  providers: [WorkspaceUsersService, PrismaService, EmailService],
  exports: [WorkspaceUsersService],
})
export class WorkspaceUsersModule {}
