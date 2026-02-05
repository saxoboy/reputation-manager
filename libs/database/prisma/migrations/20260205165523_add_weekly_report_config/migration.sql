-- CreateEnum
CREATE TYPE "ReportDay" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "WeeklyReportConfig" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "dayOfWeek" "ReportDay" NOT NULL DEFAULT 'MONDAY',
    "recipients" TEXT[],
    "lastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyReportConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReportConfig_workspaceId_key" ON "WeeklyReportConfig"("workspaceId");

-- CreateIndex
CREATE INDEX "WeeklyReportConfig_workspaceId_idx" ON "WeeklyReportConfig"("workspaceId");

-- CreateIndex
CREATE INDEX "WeeklyReportConfig_enabled_idx" ON "WeeklyReportConfig"("enabled");

-- AddForeignKey
ALTER TABLE "WeeklyReportConfig" ADD CONSTRAINT "WeeklyReportConfig_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
