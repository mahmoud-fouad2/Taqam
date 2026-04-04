import { Metadata } from "next";
import { generateMeta } from "@/lib/utils";
import { getAppLocale } from "@/lib/i18n/locale";
import { getText } from "@/lib/i18n/text";
import prisma from "@/lib/db";
import { requireTenantRole } from "@/lib/auth";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import UsersDataTable from "./data-table";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata>{
  const locale = await getAppLocale();
  return generateMeta({
    title: locale === "ar" ? "المستخدمون" : "Users",
    description:
      locale === "ar"
        ? "قائمة المستخدمين وإدارتهم."
        : "Users list and management.",
  });
}

export default async function Page() {
  const locale = await getAppLocale();
  const t = getText(locale);
  const user = await requireTenantRole(["TENANT_ADMIN", "HR_MANAGER"]);

  const users = await prisma.user.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatar: true,
      role: true,
      status: true,
      email: true,
      lastLoginAt: true,
    },
  });

  const tableData = users.map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`.trim(),
    image: u.avatar,
    role: u.role,
    status: u.status,
    email: u.email,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
  }));

  return (
    <>
      <div className="flex items-center justify-between ">
        <h1 className="text-2xl font-bold tracking-tight">{locale === "ar" ? "المستخدمون" : "Users"}</h1>
        <Button asChild>
          <Link href="/dashboard/users/add">
            <PlusCircledIcon className="me-2" /> {locale === "ar" ? "إضافة مستخدم" : "Add user"}
          </Link>
        </Button>
      </div>
      <Card>
        <CardContent>
          <UsersDataTable data={tableData} />
        </CardContent>
      </Card>
    </>
  );
}
