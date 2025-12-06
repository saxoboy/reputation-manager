import { Module } from '@nestjs/common';
import { WorkspaceUsersController } from './workspace-users.controller';
import { WorkspaceUsersService } from './workspace-users.service';
import { PrismaService } from '@reputation-manager/database';

@Module({
  controllers: [WorkspaceUsersController],
  providers: [WorkspaceUsersService, PrismaService],
  exports: [WorkspaceUsersService],
})
export class WorkspaceUsersModule {}
