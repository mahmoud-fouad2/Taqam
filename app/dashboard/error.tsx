"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export default function DashboardError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  const isEn = locale === "en";

  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="bg-destructive/10 flex h-16 w-16 items-center justify-center rounded-full">
        <AlertCircle className="text-destructive h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          {isEn ? "An unexpected error occurred" : t.common.unexpectedError}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {error.message
            ? `${error.message}`
            : isEn
              ? "Something went wrong while loading this page. Please try again."
              : "حدث خطأ ما أثناء تحميل هذه الصفحة. يرجى المحاولة مجددًا."}
        </p>
        {error.digest && (
          <p className="text-muted-foreground/60 text-xs">
            {isEn ? "Error code:" : "رمز الخطأ:"} {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>{isEn ? "Try again" : "إعادة المحاولة"}</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
          {isEn ? "Back to dashboard" : t.common.goToDashboard2}
        </Button>
      </div>
    </div>
  );
}
