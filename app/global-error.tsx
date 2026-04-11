"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

import { ErrorScreen } from "@/components/error-screen";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const locale =
    typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : "ar";

  return (
    <html>
      <body>
        <ErrorScreen
          locale={locale}
          digest={error.digest}
          description={error.message || undefined}
          reset={reset}
        />
      </body>
    </html>
  );
}
