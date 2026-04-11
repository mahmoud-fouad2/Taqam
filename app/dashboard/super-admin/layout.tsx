import { requirePlatformAdmin } from "@/lib/auth";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();

  return <div className="super-admin-layout">{children}</div>;
}
