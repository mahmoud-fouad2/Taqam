import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAppLocale } from "@/lib/i18n/locale";
import { getManagedCommercialFeatureCatalogRows } from "@/lib/marketing/feature-catalog-store";
import { FeatureCatalogManager } from "./feature-catalog-manager";

export default async function SuperAdminFeatureCatalogPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const rows = await getManagedCommercialFeatureCatalogRows();

  return (
    <div className="space-y-6">
      <section className="bg-card/80 rounded-2xl border p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isAr ? "Feature Catalog التجاري" : "Commercial feature catalog"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {isAr
            ? "إدارة الميزة من حيث العائلة، الحالة التجارية، التوفر داخل الباقات، ومسارات الـ evidence المستخدمة داخلياً."
            : "Manage each feature's family, commercial status, plan availability, and evidence paths from one place."}
        </p>
      </section>

      <FeatureCatalogManager initialRows={rows} locale={locale} />
    </div>
  );
}
