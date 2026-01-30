const {
  PrismaClient,
  UserRole,
  MessageChannel,
  CampaignStatus,
  MessageType,
  MessageStatus,
} = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const TARGET_USER_ID = 'HKtn5GQyjDaoFhz9F5MbO57PQpVHIpLz';
const TARGET_USER_EMAIL = 'test3@correo.com';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/reputation_manager_dev?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(
    `🌱 Seeding data for user: ${TARGET_USER_EMAIL} (${TARGET_USER_ID})`,
  );

  // 1. Verificar si el usuario existe
  const user = await prisma.user.findUnique({
    where: { id: TARGET_USER_ID },
  });

  if (!user) {
    console.error('❌ User not found! Please sign up first.');
    process.exit(1);
  }
  console.log('✅ User found');

  // 2. Limpiar datos antiguos
  console.log('🧹 Cleaning previous workspaces for this user...');
  const existingRelations = await prisma.workspaceUser.findMany({
    where: { userId: TARGET_USER_ID },
    include: { workspace: true },
  });

  for (const rel of existingRelations) {
    try {
      await prisma.workspace.delete({
        where: { id: rel.workspaceId },
      });
      console.log(`   Deleted workspace ${rel.workspaceId}`);
    } catch (e) {
      console.log(
        `   Could not delete workspace ${rel.workspaceId}: ${String(e)}`,
      );
    }
  }

  // 3. Crear Workspace
  console.log('Building Workspace...');
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Consultorio Dr. Test',
      plan: 'PROFESSIONAL',
      messageCredits: 500,
      smsEnabled: true,
      whatsappEnabled: true,
      emailEnabled: true,
      users: {
        create: {
          userId: TARGET_USER_ID,
          role: 'OWNER', // Mapped from Enum UserRole
        },
      },
    },
  });
  console.log(`✅ Workspace created: ${workspace.name} (${workspace.id})`);

  // 4. Crear Practice
  console.log('Building Practice...');
  const practice = await prisma.practice.create({
    data: {
      workspaceId: workspace.id,
      name: 'Consultorio Central',
      address: 'Av. Principal 123, Quito',
      phone: '+593991234567',
      googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    },
  });
  console.log(`✅ Practice created: ${practice.name}`);

  // 5. Crear Templates
  console.log('Building Templates...');
  // Enums from PrismaClient are objects like { INITIAL: 'INITIAL' }
  const templates = await Promise.all([
    prisma.template.create({
      data: {
        workspaceId: workspace.id,
        name: 'SMS Inicial Estándar',
        type: 'INITIAL',
        content:
          'Hola {name}, gracias por visitar al Dr. {doctor}. ¿Cómo calificarías tu experiencia del 1 al 5?',
        variables: ['name', 'doctor'],
      },
    }),
    prisma.template.create({
      data: {
        workspaceId: workspace.id,
        name: 'Followup Feliz',
        type: 'FOLLOWUP_HAPPY',
        content:
          '¡Nos alegra mucho! ⭐ Ayúdanos con una reseña en Google: {reviewLink}',
        variables: ['reviewLink'],
      },
    }),
    prisma.template.create({
      data: {
        workspaceId: workspace.id,
        name: 'Followup Infeliz',
        type: 'FOLLOWUP_UNHAPPY',
        content:
          'Lamentamos escuchar eso. Por favor cuéntanos qué pasó aquí: {feedbackLink}',
        variables: ['feedbackLink'],
      },
    }),
  ]);
  console.log(`✅ Created ${templates.length} templates`);

  // 6. Crear Campaña
  console.log('Building Campaign...');

  // Find the just created WorkspaceUser ID
  const ownerRelation = await prisma.workspaceUser.findFirst({
    where: { workspaceId: workspace.id, userId: TARGET_USER_ID },
  });

  const campaign = await prisma.campaign.create({
    data: {
      workspaceId: workspace.id,
      practiceId: practice.id,
      name: 'Pacientes Enero 2026',
      status: 'ACTIVE',
      scheduledHoursAfter: 2,
      createdById: ownerRelation.id,
    },
  });
  console.log(`✅ Campaign created: ${campaign.name}`);

  // 7. Crear Pacientes
  console.log('Building Patients...');
  const patientsData = [
    {
      name: 'Maria Gonzalez',
      phone: '+593991112222',
      hasConsent: true,
      appointmentTime: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
    {
      name: 'Juan Perez',
      phone: '+593993334444',
      hasConsent: true,
      appointmentTime: new Date(Date.now() - 1000 * 60 * 60 * 25),
    },
    {
      name: 'Pedro Almodovar',
      phone: '+593995556666',
      hasConsent: false,
      appointmentTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
    {
      name: 'Lucia Mendez',
      phone: '+593997778888',
      hasConsent: true,
      appointmentTime: new Date(),
    },
  ];

  for (const p of patientsData) {
    await prisma.patient.create({
      data: {
        workspaceId: workspace.id,
        campaignId: campaign.id,
        name: p.name,
        phone: p.phone,
        hasConsent: p.hasConsent,
        appointmentTime: p.appointmentTime,
        preferredChannel: 'WHATSAPP',
      },
    });
  }
  console.log(`✅ Created ${patientsData.length} patients`);

  console.log('✨ Seed complete! You can now test endpoints.');
}

main()
  .catch((e) => {
    console.error('❌ ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
