import { Metadata } from "next";
import { notFound } from "next/navigation";
import { generateMeta } from "@/lib/utils";
import { getAppLocale } from "@/lib/i18n/locale";
import prisma from "@/lib/db";
import { requireTenantRole } from "@/lib/auth";
import EditUserClient from "./edit-user-client";
import { getText } from "@/lib/i18n/text";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const locale = await getAppLocale();
  const t = getText(locale);
  const user = await prisma.user.findUnique({
    where: { id },
    select: { firstName: true, lastName: true },
  });

  const name = user ? `${user.firstName} ${user.lastName}`.trim() : "";

  return generateMeta({
    title: locale === "ar" ? `تعديل - ${name || t.audit.entityUser}` : `Edit - ${name || "User"}`,
    description: locale === "ar" ? "تعديل بيانات المستخدم" : "Edit user details",
  });
}

export default async function EditUserPage({ params }: PageProps) {
  const { id } = await params;
  const locale = await getAppLocale();
  const currentUser = await requireTenantRole(["TENANT_ADMIN", "HR_MANAGER"]);

  const user = await prisma.user.findFirst({
    where: {
      id,
      tenantId: currentUser.tenantId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      status: true,
    },
  });

  if (!user) {
    notFound();
  }

  return <EditUserClient user={user} locale={locale} />;
}
