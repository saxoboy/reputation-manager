import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

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
    super({
      log: process.env['NODE_ENV'] === 'development' 
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
