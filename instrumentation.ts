import * as Sentry from "@sentry/nextjs";

export const onRequestError = Sentry.captureRequestError;

export function register() {
  const dsn = process.env.SENTRY_DSN;

  Sentry.init({
    dsn,
    enabled: Boolean(dsn),
    tracesSampleRate: 0.1
  });
}
