import type { Metadata } from "next";

import { generateMeta } from "@/lib/utils";
import { getAppLocale } from "@/lib/i18n/locale";
import { getText } from "@/lib/i18n/text";
import { guardAuth, getPageContext } from "@/lib/guards";

import { SupportTicketsClient } from "./tickets-client";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAppLocale();
  return generateMeta({
    title: locale === "ar" ? "الدعم الفني" : "Support",
    description:
      locale === "ar" ? "تذاكر الدعم الفني ومتابعة الحلول." : "Support tickets and issue tracking."
  });
}

export default async function SupportPage() {
  await guardAuth();

  const locale = await getAppLocale();
  const t = getText(locale);
  const ctx = await getPageContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{locale === "ar" ? "الدعم الفني" : "Support"}</h1>
        <p className="text-muted-foreground">
          {ctx.isSuperAdmin
            ? locale === "ar"
              ? "متابعة تذاكر الدعم لجميع الشركات."
              : "Track support tickets across all companies."
            : locale === "ar"
              ? "افتح تذكرة وتابع الردود من فريق الدعم."
              : "Open a ticket and track replies from support."}
        </p>
      </div>

      <SupportTicketsClient locale={locale} isSuperAdmin={ctx.isSuperAdmin} tCommon={t.common} />
    </div>
  );
}
