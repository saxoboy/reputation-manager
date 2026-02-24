/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

// Sentry must be imported first
import './instrument';

import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3001;
  await app.listen(port);
  app
    .get(Logger)
    .log(
      `🚀 Worker Application is running on: http://localhost:${port}/${globalPrefix}`,
    );
}

bootstrap();
