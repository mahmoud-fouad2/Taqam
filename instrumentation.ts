import * as Sentry from "@sentry/nextjs";

import {
  getSentryDsn,
  getSentryEnvironment,
  getSentryTracesSampleRate,
  isSentryEnabled
} from "@/lib/sentry";

export const onRequestError = Sentry.captureRequestError;

export function register() {
  const dsn = getSentryDsn("server");

  Sentry.init({
    dsn,
    enabled: isSentryEnabled("server"),
    environment: getSentryEnvironment(),
    tracesSampleRate: getSentryTracesSampleRate()
  });
}
