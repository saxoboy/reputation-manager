#!/usr/bin/env node

/**
 * Script para probar la configuración de canales de un workspace
 *
 * Uso:
 * 1. Ejecutar: node --loader ts-node/esm scripts/test-channel-config.ts
 * 2. El script:
 *    - Obtiene el primer workspace
 *    - Muestra configuración actual de canales
 *    - Permite simular cambios de configuración
 */

import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface ChannelConfig {
  defaultChannel: 'SMS' | 'WHATSAPP' | 'EMAIL';
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  emailEnabled: boolean;
}

async function main() {
  console.log('🔍 Verificando configuración de canales de workspace...\n');

  // 1. Obtener primer workspace
  const workspace = await prisma.workspace.findFirst({
    select: {
      id: true,
      name: true,
      defaultChannel: true,
      smsEnabled: true,
      whatsappEnabled: true,
      emailEnabled: true,
      _count: {
        select: {
          users: true,
          campaigns: true,
          patients: true,
        },
      },
    },
  });

  if (!workspace) {
    console.error('❌ No se encontró ningún workspace en la base de datos');
    console.log(
      '\n💡 Sugerencia: Ejecuta primero el onboarding o crea un workspace',
    );
    process.exit(1);
  }

  console.log('✅ Workspace encontrado:');
  console.log(`   ID: ${workspace.id}`);
  console.log(`   Nombre: ${workspace.name}`);
  console.log(`   Usuarios: ${workspace._count.users}`);
  console.log(`   Campañas: ${workspace._count.campaigns}`);
  console.log(`   Pacientes: ${workspace._count.patients}`);
  console.log('');

  // 2. Mostrar configuración actual
  console.log('📡 Configuración actual de canales:');
  console.log(`   Canal por defecto: ${workspace.defaultChannel}`);
  console.log(
    `   SMS (Twilio):      ${workspace.smsEnabled ? '✅ Habilitado' : '❌ Deshabilitado'}`,
  );
  console.log(
    `   WhatsApp Business: ${workspace.whatsappEnabled ? '✅ Habilitado' : '❌ Deshabilitado'}`,
  );
  console.log(
    `   Email (SendGrid):  ${workspace.emailEnabled ? '✅ Habilitado' : '❌ Deshabilitado'}`,
  );
  console.log('');

  // 3. Validar configuración
  const enabledChannels = [
    workspace.smsEnabled && 'SMS',
    workspace.whatsappEnabled && 'WhatsApp',
    workspace.emailEnabled && 'Email',
  ].filter(Boolean);

  if (enabledChannels.length === 0) {
    console.error('⚠️  ADVERTENCIA: Ningún canal está habilitado!');
    console.log('   Esto impedirá el envío de mensajes en campañas');
  } else {
    console.log(`✅ Canales habilitados: ${enabledChannels.join(', ')}`);
  }

  // Validar que el canal por defecto esté habilitado
  const defaultEnabled =
    (workspace.defaultChannel === 'SMS' && workspace.smsEnabled) ||
    (workspace.defaultChannel === 'WHATSAPP' && workspace.whatsappEnabled) ||
    (workspace.defaultChannel === 'EMAIL' && workspace.emailEnabled);

  if (!defaultEnabled) {
    console.error(
      `⚠️  ADVERTENCIA: El canal por defecto (${workspace.defaultChannel}) está deshabilitado!`,
    );
    console.log('   El Worker intentará usar un canal alternativo');
  }
  console.log('');

  // 4. Simular escenarios de decisión de canal
  console.log('🎯 Escenarios de decisión de canal para pacientes:\n');

  const scenarios = [
    {
      name: 'Paciente sin preferencia',
      preferredChannel: null,
      result: workspace.defaultChannel,
    },
    {
      name: 'Paciente que prefiere SMS',
      preferredChannel: 'SMS' as const,
      result: workspace.smsEnabled ? 'SMS' : getFallbackChannel(workspace),
    },
    {
      name: 'Paciente que prefiere WhatsApp',
      preferredChannel: 'WHATSAPP' as const,
      result: workspace.whatsappEnabled
        ? 'WHATSAPP'
        : getFallbackChannel(workspace),
    },
    {
      name: 'Paciente que prefiere Email',
      preferredChannel: 'EMAIL' as const,
      result: workspace.emailEnabled ? 'EMAIL' : getFallbackChannel(workspace),
    },
  ];

  scenarios.forEach((scenario) => {
    console.log(`   ${scenario.name}:`);
    console.log(`     Preferencia: ${scenario.preferredChannel || 'ninguna'}`);
    console.log(`     Canal usado: ${scenario.result}`);
    console.log('');
  });

  // 5. Sugerencias de optimización
  console.log('💡 Sugerencias:\n');

  if (!workspace.whatsappEnabled) {
    console.log(
      '   • Considera habilitar WhatsApp para mayor engagement en Ecuador',
    );
  }

  if (
    workspace.emailEnabled &&
    !workspace.smsEnabled &&
    !workspace.whatsappEnabled
  ) {
    console.log('   • Solo Email puede tener baja tasa de respuesta');
    console.log('   • Considera habilitar al menos SMS como fallback');
  }

  if (workspace.smsEnabled && workspace.whatsappEnabled) {
    console.log('   ✅ Configuración multi-canal óptima para flexibilidad');
  }

  if (workspace.defaultChannel === 'SMS' && workspace.whatsappEnabled) {
    console.log(
      '   • Considera cambiar defaultChannel a WHATSAPP para mayor engagement',
    );
  }

  console.log('');
  console.log('✅ Verificación completada');
}

function getFallbackChannel(config: ChannelConfig): string {
  if (config.smsEnabled) return 'SMS (fallback)';
  if (config.whatsappEnabled) return 'WHATSAPP (fallback)';
  if (config.emailEnabled) return 'EMAIL (fallback)';
  return '❌ NINGUNO (ERROR)';
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
