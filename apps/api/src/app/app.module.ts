import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { PracticesModule } from '../practices/practices.module';
import { WorkspaceUsersModule } from '../workspace-users/workspace-users.module';
import { BetterAuthMiddleware } from '../auth/better-auth.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    WorkspacesModule,
    PracticesModule,
    WorkspaceUsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(BetterAuthMiddleware).forRoutes('auth/*');
  }
}
