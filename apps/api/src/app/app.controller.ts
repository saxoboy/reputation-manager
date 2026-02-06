import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppService } from './app.service';
import { PrismaService } from '@reputation-manager/database';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  // Health check endpoint - bypass Better Auth completamente
  @Get('health')
  async health(@Req() req: Request, @Res() res: Response) {
    // CORS específico para credentials
    const origin = req.headers.origin || 'http://localhost:4000';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie');

    const checks: Record<string, 'ok' | 'error'> = {
      api: 'ok',
      database: 'error',
    };

    // Check database connectivity
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    const allHealthy = Object.values(checks).every((s) => s === 'ok');

    return res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    });
  }
}
