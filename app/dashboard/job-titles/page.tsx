import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { generateMeta } from "@/lib/utils";
import { authOptions } from "@/lib/auth";
import { getText } from "@/lib/i18n/text";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAppLocale();
  const t = getText(locale);
  return generateMeta({
    title: t.jobTitles.pageTitle,
    description: t.jobTitles.pageDesc
  });
}

export default async function JobTitlesPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role === "SUPER_ADMIN") {
    redirect("/dashboard/super-admin/job-titles");
  }

  redirect("/dashboard/employees");
}
