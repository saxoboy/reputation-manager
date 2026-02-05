/**
 * Job data types para BullMQ jobs
 */

export interface SendWeeklyReportJobData {
  workspaceId: string;
  workspaceName: string;
  recipients: string[]; // Array de emails
}
