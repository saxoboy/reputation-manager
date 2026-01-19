import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from '../auth/auth.config';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { PracticesModule } from '../practices/practices.module';
import { WorkspaceUsersModule } from '../workspace-users/workspace-users.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { TemplatesModule } from '../templates/templates.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule.forRoot({
      auth,
      // No especificar disableBodyParser - usar el valor por defecto del módulo
    }),
    WorkspacesModule,
    PracticesModule,
    WorkspaceUsersModule,
    CampaignsModule,
    TemplatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
