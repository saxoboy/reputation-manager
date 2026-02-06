import * as Sentry from '@sentry/node';

// Initialize Sentry for the API service
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

    // Environment
    environment: process.env.NODE_ENV || 'development',

    // Server name for filtering in Sentry dashboard
    serverName: 'reputation-manager-api',

    // Integrations
    integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],

    // Before sending, sanitize sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });
}

export { Sentry };
