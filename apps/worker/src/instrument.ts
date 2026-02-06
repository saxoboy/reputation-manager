import * as Sentry from '@sentry/node';

// Initialize Sentry for the Worker service
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

    // Environment
    environment: process.env.NODE_ENV || 'development',

    // Server name for filtering in Sentry dashboard
    serverName: 'reputation-manager-worker',

    // Before sending, sanitize sensitive data
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });
}

export { Sentry };
