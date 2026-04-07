"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import * as Sentry from "@sentry/nextjs";

import { ErrorScreen } from "@/components/error-screen";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const locale = pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ar";

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <ErrorScreen
      locale={locale}
      digest={error.digest}
      description={error.message || undefined}
      reset={reset}
    />
  );
}