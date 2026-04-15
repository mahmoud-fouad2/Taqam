"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

export function DashboardBackButton({ locale }: { locale: "ar" | "en" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const cleanPath = pathname.replace(/^\/en/, "") || "/dashboard";
  const segments = cleanPath.split("/").filter(Boolean);
  const hasQuery = searchParams.toString().length > 0;
  const showButton = segments.length > 1 || hasQuery;

  if (!showButton) {
    return null;
  }

  const Icon = locale === "ar" ? ArrowRight : ArrowLeft;
  const prefix = locale === "en" ? "/en" : "";
  const fallback = cleanPath.startsWith("/dashboard/super-admin")
    ? `${prefix}/dashboard/super-admin`
    : `${prefix}/dashboard`;

  return (
    <Button
      type="button"
      variant="ghost"
      className="border-border/70 bg-background/75 hover:bg-accent/80 h-9 rounded-lg border px-3 shadow-sm"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallback);
      }}>
      <Icon className="h-4 w-4" />
      <span className="hidden text-sm sm:inline">{locale === "ar" ? "رجوع" : "Back"}</span>
    </Button>
  );
}
