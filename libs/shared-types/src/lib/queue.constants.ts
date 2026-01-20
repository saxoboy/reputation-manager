export const QUEUES = {
  CAMPAIGNS: 'campaigns',
} as const;

export const JOBS = {
  SEND_INITIAL_MESSAGE: 'send-initial-message',
  HANDLE_RESPONSE: 'handle-response',
  SEND_FOLLOWUP: 'send-followup',
} as const;
