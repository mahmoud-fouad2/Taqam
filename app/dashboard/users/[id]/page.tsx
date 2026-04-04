import { Metadata } from "next";
import { notFound } from "next/navigation";
import { generateMeta } from "@/lib/utils";
import { getAppLocale } from "@/lib/i18n/locale";
import prisma from "@/lib/db";
import { requireTenantRole } from "@/lib/auth";
import UserDetailsClient from "./user-details-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const locale = await getAppLocale();
  const user = await prisma.user.findUnique({
    where: { id },
    select: { firstName: true, lastName: true },
  });

  const name = user ? `${user.firstName} ${user.lastName}`.trim() : "";
  
  return generateMeta({
    title: locale === "ar" ? `${name || "المستخدم"} - تفاصيل` : `${name || "User"} - Details`,
    description: locale === "ar" ? "عرض تفاصيل المستخدم" : "View user details",
  });
}

export default async function UserDetailsPage({ params }: PageProps) {
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
      avatar: true,
      role: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      employee: {
        select: {
          id: true,
          employeeNumber: true,
          hireDate: true,
          department: {
            select: { name: true, nameAr: true },
          },
          jobTitle: {
            select: { name: true, nameAr: true },
          },
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const userData = {
    ...user,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
    employee: user.employee
      ? {
          ...user.employee,
          hireDate: user.employee.hireDate?.toISOString() || null,
        }
      : null,
  };

  return <UserDetailsClient user={userData} locale={locale} />;
}
