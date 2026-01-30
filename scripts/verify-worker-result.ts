// scripts/verify-worker-result.ts
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
  console.log('🕵️‍♀️ Verifying Worker Results...');

  // 1. Find the patient
  const patient = await prisma.patient.findFirst({
    where: { phone: '+593991234567' },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!patient) {
    console.error('❌ Patient not found. Did you run setup-whatsapp-test.ts?');
    process.exit(1);
  }

  console.log(`👤 Patient: ${patient.name} (${patient.id})`);
  console.log(`📊 Total Messages: ${patient.messages.length}`);

  // 2. Check Initial Message Response
  // Buscamos el mensaje INITIAL (puede no ser el último si ya se creó el followup)
  const initialMsg = patient.messages.find((m) => m.type === 'INITIAL');

  if (!initialMsg) {
    console.error('❌ No INITIAL message found.');
  } else {
    console.log(`\n📨 Initial Message Analysis:`);
    console.log(`   ID: ${initialMsg.id}`);
    console.log(`   Status: ${initialMsg.status}`);
    console.log(`   Rating: ${initialMsg.rating}`);

    if (initialMsg.status === 'REPLIED' && initialMsg.rating === 5) {
      console.log('   ✅ Initial message updated correctly (User replied)');
    } else {
      console.log('   ⚠️  Initial message NOT updated yet (Worker pending?)');
    }
  }

  // 3. Check Followup Message
  const followupMsg = patient.messages.find((m) => m.type.includes('FOLLOWUP'));

  if (!followupMsg) {
    console.log('\n⏳ No FOLLOWUP message found yet.');
    console.log('   Possible reasons:');
    console.log('   1. Worker is not running (pnpm dev)');
    console.log('   2. Webhook was not called');
    console.log('   3. Job is still in queue (delayed)');
  } else {
    console.log(`\n🚀 Followup Message Found!`);
    console.log(
      `   Type: ${followupMsg.type} ${followupMsg.type === 'FOLLOWUP_HAPPY' ? '✅' : '❓'}`,
    );
    console.log(
      `   Channel: ${followupMsg.channel} ${followupMsg.channel === 'WHATSAPP' ? '✅' : '❓'}`,
    );
    console.log(`   Content: "${followupMsg.content.substring(0, 60)}..."`);
    console.log(`   Status: ${followupMsg.status}`);
    console.log('\n🎉 FULL INTEGRATION SUCCESSFUL!');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
