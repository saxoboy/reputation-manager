-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "defaultChannel" "MessageChannel" NOT NULL DEFAULT 'SMS',
ADD COLUMN     "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false;
