// scripts/setup-whatsapp-test.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString =
  process.env['DATABASE_URL'] ||
  'postgresql://postgres:postgres@localhost:5432/reputation_manager_dev?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Setting up WhatsApp test data...');

  // 1. User
  let user = await prisma.user.findFirst({
    where: { email: 'whatsapp-tester@example.com' },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'whatsapp-tester@example.com',
        name: 'WhatsApp Tester',
        emailVerified: true,
      },
    });
    console.log('✅ User created');
  }

  // 2. Workspace
  let workspace = await prisma.workspace.findFirst({
    where: { name: 'WhatsApp Setup WS' },
  });
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: 'WhatsApp Setup WS',
        plan: 'FREE',
      },
    });
    console.log('✅ Workspace created');
  }

  // 3. WorkspaceUser
  let workspaceUser = await prisma.workspaceUser.findFirst({
    where: { userId: user.id, workspaceId: workspace.id },
  });
  if (!workspaceUser) {
    workspaceUser = await prisma.workspaceUser.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: 'OWNER',
      },
    });
    console.log('✅ WorkspaceUser created');
  }

  // 4. Practice
  let practice = await prisma.practice.findFirst({
    where: { workspaceId: workspace.id },
  });
  if (!practice) {
    practice = await prisma.practice.create({
      data: {
        workspaceId: workspace.id,
        name: 'WhatsApp Practice',
      },
    });
    console.log('✅ Practice created');
  }

  // 5. Campaign
  let campaign = await prisma.campaign.findFirst({
    where: { workspaceId: workspace.id, name: 'WA Campaign' },
  });
  if (!campaign) {
    campaign = await prisma.campaign.create({
      data: {
        name: 'WA Campaign',
        workspaceId: workspace.id,
        practiceId: practice.id,
        createdById: workspaceUser.id,
        status: 'ACTIVE',
      },
    });
    console.log('✅ Campaign created');
  }

  // 6. Patient (+593991234567)
  const PHONE = '+593991234567';
  let patient = await prisma.patient.findFirst({
    where: { phone: PHONE, campaignId: campaign.id },
  });

  if (patient) {
    console.log('♻️  Resetting patient messages...');
    await prisma.message.deleteMany({ where: { patientId: patient.id } });
    await prisma.patient.delete({ where: { id: patient.id } });
  }

  patient = await prisma.patient.create({
    data: {
      name: 'Pepito Pérez',
      phone: PHONE,
      appointmentTime: new Date(),
      hasConsent: true,
      preferredChannel: 'WHATSAPP',
      campaignId: campaign.id,
      workspaceId: workspace.id,
    },
  });
  console.log('✅ Patient created:', PHONE);

  // 7. Initial Message
  await prisma.message.create({
    data: {
      type: 'INITIAL',
      channel: 'WHATSAPP',
      status: 'SENT',
      content: 'Template: feedback_request_v1',
      sentAt: new Date(),
      patientId: patient.id,
      campaignId: campaign.id,
      workspaceId: workspace.id,
    },
  });
  console.log('✅ Initial Message created (SENT)');

  console.log('\n🎉 Ready to test! Run the curl command now.');
}

// I'll read the schema first to be safe.
main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
