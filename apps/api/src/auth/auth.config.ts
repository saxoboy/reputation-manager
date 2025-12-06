import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@reputation-manager/database';

export const auth = betterAuth({
  basePath: '/api/auth',

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Por ahora false para desarrollo
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      enabled: !!process.env.GOOGLE_CLIENT_ID,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // Actualizar cada 24 horas
  },

  secret: process.env.BETTER_AUTH_SECRET,

  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',

  trustedOrigins: ['http://localhost:4000', 'http://localhost:3000'],

  hooks: {}, // Requerido para usar @Hook decorators
});

export type Session = typeof auth.$Infer.Session;
