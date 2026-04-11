import type { ReactNode } from "react";

import { requireTenantRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function UsersLayout({ children }: { children: ReactNode }) {
  await requireTenantRole(["TENANT_ADMIN", "HR_MANAGER"]);

  return <>{children}</>;
}
