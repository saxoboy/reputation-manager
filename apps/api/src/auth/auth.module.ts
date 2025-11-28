import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '@reputation-manager/database';
import { AuthGuard } from './guards/auth.guard';
import { WorkspaceGuard } from './guards/workspace.guard';
import { RoleGuard } from './guards/role.guard';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    AuthGuard,
    WorkspaceGuard,
    RoleGuard,
  ],
  exports: [
    AuthService,
    AuthGuard,
    WorkspaceGuard,
    RoleGuard,
  ],
})
export class AuthModule {}
