import { cookies, headers } from "next/headers";

import { getCurrentUser } from "@/lib/auth";
import { isSuperAdminRole } from "@/lib/access-control";

export async function TenantBadge() {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const user = await getCurrentUser();
  const locale = cookieStore.get("taqam_locale")?.value === "en" ? "en" : "ar";

  const tenantFromHeader = headerStore.get("x-tenant-slug");
  const tenantFromCookie = cookieStore.get("taqam_tenant")?.value;
  const tenantFromSession = user?.tenant?.nameAr || user?.tenant?.name || user?.tenant?.slug;
  const workspaceLabel = isSuperAdminRole(user?.role)
    ? locale === "ar"
      ? "إدارة المنصة"
      : "Platform Admin"
    : tenantFromSession ||
      tenantFromHeader ||
      tenantFromCookie ||
      (locale === "ar" ? "شركة غير محددة" : "Tenant not set");

  return (
    <div className="text-muted-foreground rounded-full border px-3 py-1 text-xs">
      {locale === "ar" ? "مساحة العمل:" : "Workspace:"}{" "}
      <span className="text-foreground font-medium">{workspaceLabel}</span>
    </div>
  );
}
