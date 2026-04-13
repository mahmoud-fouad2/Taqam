/**
 * Pricing Plans Management Page (Super Admin)
 * إدارة خطط التسعير
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { FeatureComparisonManager } from "./feature-comparison-manager";
import { PricingPlansManager } from "./pricing-plans-manager";
import { getAppLocale } from "@/lib/i18n/locale";
import { getText } from "@/lib/i18n/text";

export default async function PricingPlansPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <section className="border-border/60 bg-card/80 supports-[backdrop-filter]:bg-card/70 rounded-2xl border p-5 shadow-sm backdrop-blur">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.pricingPlans.pManagePricingAndPlans}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t.pricingPlans.pUpdatePlanPricesAndFeaturesSho}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {t.pricingPlans.comparisonManagementHint}
        </p>
      </section>

      <PricingPlansManager />
      <FeatureComparisonManager />
    </div>
  );
}
