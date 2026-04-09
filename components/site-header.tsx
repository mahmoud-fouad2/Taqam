import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb";
import { DashboardHeaderActions } from "@/components/dashboard-header-actions";

export function SiteHeader({
  locale,
  dir,
}: {
  locale: "ar" | "en";
  dir: "rtl" | "ltr";
}) {
  return (
    <header
      data-dir={dir}
      className="dashboard-header sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border/70 bg-background/80 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
    >
      <div className="dashboard-header-inner flex w-full items-center gap-2 px-3 lg:px-5">
        <SidebarTrigger className="-ms-1 rounded-lg" />
        <Separator
          orientation="vertical"
          className="mx-1 hidden data-[orientation=vertical]:h-5 sm:block"
        />
        <div className="min-w-0 flex-1 overflow-hidden">
          <DashboardBreadcrumb />
        </div>
        <div className="ms-auto flex shrink-0 items-center gap-2">
          <DashboardHeaderActions locale={locale} />
        </div>
      </div>
    </header>
  )
}
