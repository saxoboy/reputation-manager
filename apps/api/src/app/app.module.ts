import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { AuthModule } from '../auth/auth.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { PracticesModule } from '../practices/practices.module';
import { WorkspaceUsersModule } from '../workspace-users/workspace-users.module';
import { auth } from '../auth/auth.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BetterAuthModule.forRoot({ auth }),
    AuthModule,
    WorkspacesModule,
    PracticesModule,
    WorkspaceUsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
