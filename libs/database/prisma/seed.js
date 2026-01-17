const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Limpiar datos existentes (opcional, solo en desarrollo)
  console.log('🧹 Limpiando datos existentes...');
  await prisma.message.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.template.deleteMany();
  await prisma.practice.deleteMany();
  await prisma.workspaceUser.deleteMany();
  await prisma.workspace.deleteMany();

  console.log('✅ Datos limpios');
  console.log('\n📝 Para comenzar:');
  console.log('   1. Inicia el servidor: pnpm nx serve api');
  console.log('   2. Abre Postman');
  console.log('   3. POST http://localhost:3000/api/auth/sign-up/email');
  console.log(
    '   4. Body: { "email": "doctor@correo.com", "password": "password123", "name": "Dr. Juan Pérez" }'
  );
  console.log('\n💡 Después de registrarte:');
  console.log('   - Crea un workspace: POST /api/workspaces');
  console.log('   - Crea una práctica: POST /api/workspaces/:id/practices');
  console.log('   - Crea una campaña: POST /api/campaigns');
  console.log('\n📊 Schema completo incluye:');
  console.log('   ✅ User, Account, Session (Auth)');
  console.log('   ✅ Workspace, WorkspaceUser, Practice');
  console.log('   ✅ Campaign, Patient, Message, Template');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
