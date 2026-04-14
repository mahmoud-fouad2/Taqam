import * as Sentry from "@sentry/nextjs";

import {
  getSentryDsn,
  getSentryEnvironment,
  getSentryTracesSampleRate,
  isSentryEnabled
} from "@/lib/sentry";

Sentry.init({
  dsn: getSentryDsn("server"),
  enabled: isSentryEnabled("server"),

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: getSentryTracesSampleRate(),

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Environment
  environment: getSentryEnvironment(),

  // Ignore certain errors
  ignoreErrors: [
    "Non-Error promise rejection captured",
    "NetworkError",
    "Network request failed",
    "Failed to fetch"
  ],

  beforeSend(event, hint) {
    // Filter out sensitive data from server-side errors
    if (event.request) {
      delete event.request.cookies;

      if (event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
    }

    // Sanitize user info
    if (event.user) {
      event.user = {
        id: event.user.id
      };
    }

    // Don't log database connection strings or API keys
    if (event.extra) {
      const sensitiveKeys = ["DATABASE_URL", "JWT_SECRET", "NEXTAUTH_SECRET"];
      for (const key of sensitiveKeys) {
        if (event.extra[key]) {
          event.extra[key] = "[REDACTED]";
        }
      }
    }

    return event;
  }
});
