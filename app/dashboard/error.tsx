"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const isEn = pathname === "/en/dashboard" || pathname.startsWith("/en/");

  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          {isEn ? "An unexpected error occurred" : "حدث خطأ غير متوقع"}
        </h2>
        <p className="max-w-md text-muted-foreground">
          {error.message
            ? `${error.message}`
            : isEn
              ? "Something went wrong while loading this page. Please try again."
              : "حدث خطأ ما أثناء تحميل هذه الصفحة. يرجى المحاولة مجددًا."}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60">
            {isEn ? "Error code:" : "رمز الخطأ:"} {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>{isEn ? "Try again" : "إعادة المحاولة"}</Button>
        <Button variant="outline" onClick={() => (window.location.href = isEn ? "/en/dashboard" : "/dashboard")}>
          {isEn ? "Back to dashboard" : "العودة للوحة التحكم"}
        </Button>
      </div>
    </div>
  );
}
