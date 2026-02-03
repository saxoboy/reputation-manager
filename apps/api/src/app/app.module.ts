import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 segundos (1 minuto)
        limit: 20, // 20 peticiones por minuto
      },
    ]),
    AuthModule.forRoot({
      auth,
      basePath: '/api/auth', // Especificar la ruta completa incluyendo el prefijo global
      publicRoutes: ['/health'], // Rutas que no requieren autenticación
    }),
    WorkspacesModule,
    PracticesModule,
    WorkspaceUsersModule,
    CampaignsModule,
    TemplatesModule,
    PatientsModule,
    MessagesModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
