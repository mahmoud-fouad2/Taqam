import type { Metadata } from "next";
import React from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { PageTransition } from "@/components/motion/page-transition";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { isSuperAdminRole } from "@/lib/access-control";
import { getSetupStatus } from "@/lib/setup";

export const metadata: Metadata = {
  title: {
    default: "Dashboard | Taqam",
    template: "%s | Dashboard | Taqam"
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      noarchive: true
    }
  }
};

export default async function Page({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();

  // Redirect new tenant admins to setup wizard until setup is complete
  const headerStore = await headers();
  const pathname = headerStore.get("x-invoke-path") || headerStore.get("x-pathname") || "";
  const isSetupPage = pathname.includes("/dashboard/setup");
  if (
    !isSetupPage &&
    user.tenantId &&
    !isSuperAdminRole(user.role) &&
    user.role === "TENANT_ADMIN"
  ) {
    const setupStatus = await getSetupStatus(user.tenantId);
    if (!setupStatus.isComplete) {
      redirect("/dashboard/setup");
    }
  }

  const cookieStore = await cookies();
  const locale = cookieStore.get("taqam_locale")?.value === "en" ? "en" : "ar";
  const dir = locale === "ar" ? "rtl" : "ltr";
  const sidebarSide = dir === "rtl" ? "right" : "left";

  return (
    <div
      className={`dashboard-shell min-h-screen ${dir === "rtl" ? "direction-rtl" : "direction-ltr"}`}
      data-locale={locale}
      data-dir={dir}>
      <SidebarProvider className="[--header-height:calc(var(--spacing)*13)] [--sidebar-width-icon:4.5rem] [--sidebar-width:calc(var(--spacing)*74)]">
        <AppSidebar variant="inset" side={sidebarSide} dir={dir} />
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
  );
}
