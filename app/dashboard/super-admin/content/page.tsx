import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { getAppLocale } from "@/lib/i18n/locale";

import { SiteContentManager } from "./site-content-manager";

export default async function SuperAdminContentPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <section className="bg-card/80 rounded-2xl border p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isAr ? "استوديو المحتوى والسيو" : "Content and SEO studio"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {isAr
            ? "تحكم في النصوص العامة للصفحات التسويقية، اسم المنصة، ووصف السيو الافتراضي من مكان واحد."
            : "Control public marketing copy, platform naming, and default SEO descriptions from one place."}
        </p>
      </section>

      <SiteContentManager locale={locale} />
    </div>
  );
}
