import type { Metadata } from "next";
import React from "react";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth";
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { PageTransition } from "@/components/motion/page-transition";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export const metadata: Metadata = {
  title: {
    default: "Dashboard | Taqam",
    template: "%s | Dashboard | Taqam",
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      noarchive: true,
    },
  },
};

export default async function Page({ children }: { children: React.ReactNode }) {
  await requireAuth();
  const cookieStore = await cookies();
  const locale = cookieStore.get("taqam_locale")?.value === "en" ? "en" : "ar";
  const dir = locale === "ar" ? "rtl" : "ltr";
  const sidebarSide = dir === "rtl" ? "right" : "left";

  return (
    <div
      className={`dashboard-shell min-h-screen ${dir === "rtl" ? "direction-rtl" : "direction-ltr"}`}
      data-locale={locale}
      data-dir={dir}
    >
      <SidebarProvider
        className="[--sidebar-width:calc(var(--spacing)*74)] [--sidebar-width-icon:4.5rem] [--header-height:calc(var(--spacing)*13)]"
      >
        <AppSidebar variant="inset" side={sidebarSide} />
        <SidebarInset className="dashboard-main-surface">
          <SiteHeader locale={locale} dir={dir} />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col">
              <div className="dashboard-content-wrap flex flex-col gap-4 p-4 md:gap-6 lg:p-6">
                <PageTransition>{children}</PageTransition>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
