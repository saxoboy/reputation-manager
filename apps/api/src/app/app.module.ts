import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { PrismaService } from '@reputation-manager/database';
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
import { AnalyticsModule } from '../analytics/analytics.module';
import { WeeklyReportsModule } from '../weekly-reports/weekly-reports.module';
import { BillingModule } from '../billing/billing.module';
import { RedisCacheModule } from '../cache/redis-cache.module';
import { FeedbackModule } from '../feedback/feedback.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: { colorize: true, singleLine: true },
              }
            : undefined,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_URL?.includes('://')
          ? new URL(process.env.REDIS_URL).hostname
          : process.env.REDIS_URL?.split(':')[0] || 'localhost',
        port: process.env.REDIS_URL?.includes('://')
          ? parseInt(new URL(process.env.REDIS_URL).port || '6379')
          : parseInt(process.env.REDIS_URL?.split(':')[1] || '6379'),
        password: process.env.REDIS_URL?.includes('://')
          ? new URL(process.env.REDIS_URL).password || undefined
          : undefined,
      },
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
      publicRoutes: ['/health', '/api/invitations', '/api/feedback'], // Rutas que no requieren autenticación
    }),
    WorkspacesModule,
    PracticesModule,
    WorkspaceUsersModule,
    CampaignsModule,
    TemplatesModule,
    PatientsModule,
    MessagesModule,
    WebhooksModule,
    AnalyticsModule,
    WeeklyReportsModule,
    BillingModule,
    RedisCacheModule,
    FeedbackModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
