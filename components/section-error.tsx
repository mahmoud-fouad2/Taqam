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
      <div className="bg-destructive/10 flex h-14 w-14 items-center justify-center rounded-full">
        <AlertCircle className="text-destructive h-7 w-7" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight">حدث خطأ</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          {error.message || "حدث خطأ أثناء تحميل هذه الصفحة. يرجى المحاولة مجدداً."}
        </p>
        {error.digest && (
          <p className="text-muted-foreground/50 text-xs">رمز الخطأ: {error.digest}</p>
        )}
      </div>
      <Button size="sm" onClick={reset} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        إعادة المحاولة
      </Button>
    </div>
  );
}
