import { Metadata } from "next";
import { requireTenantAccess } from "@/lib/auth";
import { generateMeta } from "@/lib/utils";
import { redirect } from "next/navigation";
import { RolesManager } from "./roles-manager";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "الأدوار والصلاحيات | الإعدادات",
    description: "إدارة الأدوار المخصصة وصلاحيات المستخدمين"
  });
}

export default async function RolesPage() {
  const user = await requireTenantAccess();
  if (user.role !== "TENANT_ADMIN") {
    redirect("/dashboard/settings");
  }
  return <RolesManager />;
}
