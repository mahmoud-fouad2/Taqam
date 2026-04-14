/**
 * Select Tenant Page
 * صفحة اختيار الشركة (Tenant)
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TenantAccess } from "@/components/tenant-access";
import { marketingMetadata } from "@/lib/marketing/seo";
import { getAppLocale } from "@/lib/i18n/locale";
import { FadeIn } from "@/components/ui/fade-in";
import { getCurrentUser } from "@/lib/auth";
import { buildTenantPath, buildTenantUrl, isLocalTenantDevelopmentHost } from "@/lib/tenant";
import { getTenantRequestHost } from "@/lib/tenant.server";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    path: "/select-tenant",
    titleAr: "اختيار الشركة | طاقم",
    titleEn: "Select Tenant | Taqam",
    descriptionAr: "اختر شركتك (Tenant) للدخول إلى لوحة التحكم.",
    descriptionEn: "Select your tenant to continue to the dashboard.",
    noIndex: true
  });
}

function safeNextPath(value: string | string[] | undefined): string | undefined {
  if (!value || typeof value !== "string") return undefined;
  if (!value.startsWith("/")) return undefined;
  if (value.startsWith("//")) return undefined;
  return value;
}

export default async function SelectTenantPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const nextPath = safeNextPath(sp?.next) ?? "/dashboard";
  const locale = await getAppLocale();

  // If the user is already authenticated and has a tenant, skip this page entirely
  const user = await getCurrentUser();
  if (user?.tenantId && user.tenant?.slug) {
    const requestHost = await getTenantRequestHost();
    if (isLocalTenantDevelopmentHost(requestHost)) {
      redirect(buildTenantPath(user.tenant.slug, nextPath, locale));
    }

    redirect(buildTenantUrl(user.tenant.slug, nextPath, requestHost));
  }

  if (user?.tenantId) {
    redirect(nextPath);
  }
  const isAr = locale === "ar";

  const demoTenants = [
    { slug: "demo", labelAr: "Demo", labelEn: "Demo" },
    { slug: "elite-tech", labelAr: "النخبة للتقنية", labelEn: "Elite Tech" },
    { slug: "riyadh-trading", labelAr: "الرياض التجارية", labelEn: "Riyadh Trading" },
    { slug: "future-co", labelAr: "شركة المستقبل", labelEn: "Future Co" }
  ];

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <FadeIn direction="up">
        <div className="bg-card rounded-2xl border p-6 shadow-sm">
          <h1 className="text-2xl font-bold">{isAr ? "اختيار الشركة" : "Select tenant"}</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {isAr
              ? "لازم تختار شركتك (Tenant) قبل الدخول للداشبورد على هذا الدومين."
              : "You must select your tenant before entering the dashboard on this domain."}
          </p>

          <div className="mt-6">
            <TenantAccess nextPath={nextPath} locale={locale} presets={demoTenants} />
          </div>

          <p className="text-muted-foreground mt-6 text-xs">
            {isAr
              ? "ملاحظة: للموبايل استخدم مدخل الجوال /m ولا تحتاج اختيار الشركة."
              : "Note: For mobile use /m; tenant selection is not required."}
          </p>
        </div>
      </FadeIn>
    </main>
  );
}
