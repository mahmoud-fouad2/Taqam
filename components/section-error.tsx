"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SectionErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function SectionError({ error, reset }: SectionErrorProps) {
  useEffect(() => {
    console.error("[Section Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-7 w-7 text-destructive" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight">حدث خطأ</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {error.message || "حدث خطأ أثناء تحميل هذه الصفحة. يرجى المحاولة مجدداً."}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/50">رمز الخطأ: {error.digest}</p>
        )}
      </div>
      <Button size="sm" onClick={reset} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        إعادة المحاولة
      </Button>
    </div>
  );
}
