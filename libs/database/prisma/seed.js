const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Better Auth genera el hash automáticamente cuando creas el usuario
  // Por ahora, creamos solo el workspace y practice para el primer usuario que se registre

  console.log('✅ Base de datos lista para recibir registros');
  console.log('\n📝 Para comenzar:');
  console.log('   1. Ve a http://localhost:4000');
  console.log('   2. Click en "Comenzar Gratis"');
  console.log('   3. Regístrate con tu email');
  console.log('\n💡 Tip: Usa un email real para desarrollo (ej: tu@email.com)');
  console.log('   Password sugerido: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

