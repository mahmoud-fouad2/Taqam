"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">حدث خطأ غير متوقع</h2>
        <p className="max-w-md text-muted-foreground">
          {error.message
            ? `${error.message}`
            : "حدث خطأ ما أثناء تحميل هذه الصفحة. يرجى المحاولة مجدداً."}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60">رمز الخطأ: {error.digest}</p>
        )}
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>إعادة المحاولة</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
          العودة للرئيسية
        </Button>
      </div>
    </div>
  );
}
