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
import { PatientsModule } from '../patients/patients.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule.forRoot({
      auth,
      basePath: '/api/auth', // Especificar la ruta completa incluyendo el prefijo global
    }),
    WorkspacesModule,
    PracticesModule,
    WorkspaceUsersModule,
    CampaignsModule,
    TemplatesModule,
    PatientsModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
