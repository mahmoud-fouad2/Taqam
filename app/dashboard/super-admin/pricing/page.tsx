/**
 * Pricing Plans Management Page (Super Admin)
 * إدارة خطط التسعير
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
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
      <section className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <h1 className="text-2xl font-semibold tracking-tight">{t.pricingPlans.pManagePricingAndPlans}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.pricingPlans.pUpdatePlanPricesAndFeaturesSho}
        </p>
      </section>

      <PricingPlansManager />
    </div>
  );
}
