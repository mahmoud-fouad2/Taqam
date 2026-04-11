import Link from "next/link";

import { getAppLocale } from "@/lib/i18n/locale";
import { getText } from "@/lib/i18n/text";

import { Button } from "@/components/ui/button";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  const locale = await getAppLocale();
  const t = getText(locale);

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.common.changePassword}</h1>
        <p className="text-muted-foreground">
          {locale === "ar"
            ? "قم بتغيير كلمة المرور الخاصة بك للحفاظ على أمان حسابك."
            : "Change your password to keep your account secure."}
        </p>
      </div>

      <ChangePasswordForm locale={locale} />

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" asChild>
          <Link href="/dashboard/my-profile">{locale === "ar" ? t.common.back : "Back"}</Link>
        </Button>
      </div>
    </div>
  );
}
