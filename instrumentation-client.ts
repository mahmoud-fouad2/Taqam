import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true
    })
  ],
  environment: process.env.NODE_ENV || "development",
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
