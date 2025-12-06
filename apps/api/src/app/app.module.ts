import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from '../auth/auth.config';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { PracticesModule } from '../practices/practices.module';
import { WorkspaceUsersModule } from '../workspace-users/workspace-users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BetterAuthModule.forRoot({
      auth,
      disableTrustedOriginsCors: false,
      disableBodyParser: false,
      disableGlobalAuthGuard: false,
    }),
    WorkspacesModule,
    PracticesModule,
    WorkspaceUsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
