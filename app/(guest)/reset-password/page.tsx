import type { Metadata } from "next";

import { getAppLocale } from "@/lib/i18n/locale";
import { marketingMetadata } from "@/lib/marketing/seo";
import { ResetPasswordForm } from "./reset-password-form";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    path: "/reset-password",
    titleAr: "تعيين كلمة المرور | طاقم",
    titleEn: "Set password | Taqam",
    descriptionAr: "تعيين كلمة مرور جديدة أو تفعيل حساب الشركة.",
    descriptionEn: "Set a new password or activate your company account.",
    noIndex: true,
  });
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const sp = searchParams ? await searchParams : undefined;
  const token = typeof sp?.token === "string" ? sp.token : null;

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-background py-16">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            {isAr ? "تعيين كلمة المرور" : "Set your password"}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {isAr
              ? "أكمل تعيين كلمة المرور لتفعيل الحساب أو استعادة الوصول بأمان."
              : "Finish setting your password to activate the account or restore access securely."}
          </p>
        </div>

        <ResetPasswordForm locale={locale} token={token} />
      </div>
    </main>
  );
}