import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { guardAuth, guardTenant } from "@/lib/guards";
import { getSetupStatus, SETUP_STEPS, SETUP_TOTAL_STEPS } from "@/lib/setup";
import { getTenantContext } from "@/lib/tenant.server";
import db from "@/lib/db";
import { SetupWizard } from "./setup-wizard";

export const metadata: Metadata = {
  title: "إعداد الشركة | طاقم",
  description: "أكمل إعداد مساحة عملك خطوة بخطوة"
};

export default async function SetupPage() {
  await guardAuth();
  await guardTenant();

  const { slug } = await getTenantContext();
  if (!slug) redirect("/dashboard");

  const tenant = await db.tenant.findUnique({ where: { slug }, select: { id: true, name: true } });
  if (!tenant) redirect("/dashboard");

  const status = await getSetupStatus(tenant.id);

  // Already complete → redirect to dashboard
  if (status.isComplete) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center py-8">
      <SetupWizard
        tenantId={tenant.id}
        tenantName={tenant.name}
        initialStep={Math.max(1, status.currentStep + 1)}
        totalSteps={SETUP_TOTAL_STEPS}
        steps={SETUP_STEPS}
        savedData={status.data}
      />
    </div>
  );
}
