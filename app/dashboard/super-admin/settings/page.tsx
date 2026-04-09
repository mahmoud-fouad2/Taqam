/**
 * Platform Settings Page (Super Admin)
 * إعدادات المنصة
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { PlatformSettingsManager } from "./platform-settings-manager";
import { getAppLocale } from "@/lib/i18n/locale";
import { getText } from "@/lib/i18n/text";

export default async function PlatformSettingsPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <h1 className="text-2xl font-semibold tracking-tight">{t.platformSettings.pPlatformSettings}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.platformSettings.pConfigureGeneralPlatformSettin}
        </p>
      </section>

      <PlatformSettingsManager />
    </div>
  );
}
