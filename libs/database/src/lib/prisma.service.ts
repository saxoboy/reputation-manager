import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * PrismaService - Servicio de Prisma para NestJS
 *
 * Maneja la conexión a la base de datos y el ciclo de vida.
 *
 * Uso:
 * constructor(private prisma: PrismaService) {}
 *
 * async findUser() {
 *   return this.prisma.user.findMany();
 * }
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Crear adapter para PostgreSQL
    const connectionString =
      process.env['DATABASE_URL'] ||
      'postgresql://postgres:postgres@localhost:5432/reputation_manager_dev?schema=public';

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log:
        process.env['NODE_ENV'] === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
