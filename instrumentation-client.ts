import * as Sentry from "@sentry/nextjs";

import {
  getSentryDsn,
  getSentryEnvironment,
  getSentryReplayOnErrorSampleRate,
  getSentryReplaySessionSampleRate,
  getSentryTracesSampleRate,
  isSentryEnabled
} from "@/lib/sentry";

const dsn = getSentryDsn("client");

Sentry.init({
  dsn,
  enabled: isSentryEnabled("client"),
  tracesSampleRate: getSentryTracesSampleRate(),
  debug: false,
  replaysOnErrorSampleRate: getSentryReplayOnErrorSampleRate(),
  replaysSessionSampleRate: getSentryReplaySessionSampleRate(),
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true
    })
  ],
  environment: getSentryEnvironment(),
  ignoreErrors: [
    "Non-Error promise rejection captured",
    "ResizeObserver loop limit exceeded",
    "Extension context invalidated",
    "NetworkError",
    "Network request failed",
    "Failed to fetch",
    "Load failed",
    "AbortError",
    "The operation was aborted"
  ],
  beforeSend(event) {
    if (event.request) {
      delete event.request.cookies;

      if (event.request.headers) {
        delete event.request.headers.Authorization;
        delete event.request.headers.Cookie;
      }
    }

    if (event.user) {
      event.user = {
        id: event.user.id
      };
    }

    return event;
  }
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
