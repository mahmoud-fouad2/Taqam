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
  environment: getSentryEnvironment()
});
