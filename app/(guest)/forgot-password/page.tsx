import type { Metadata } from "next";

import { getAppLocale } from "@/lib/i18n/locale";
import { marketingMetadata } from "@/lib/marketing/seo";
import { FadeIn } from "@/components/ui/fade-in";
import { ForgotPasswordForm } from "./forgot-password-form";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    path: "/forgot-password",
    titleAr: "استعادة الحساب | طاقم",
    titleEn: "Recover account | Taqam",
    descriptionAr: "أرسل رابط استعادة أو تفعيل الحساب إلى بريدك الإلكتروني.",
    descriptionEn: "Send an account recovery or activation link to your email.",
    noIndex: true,
  });
}

export default async function ForgotPasswordPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-background py-16">
      <FadeIn direction="up">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight">
              {isAr ? "استعادة الوصول إلى حسابك" : "Recover access to your account"}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              {isAr
                ? "أدخل بريدك الإلكتروني وسنرسل لك رابطًا آمنًا لإعادة تعيين كلمة المرور أو تفعيل الحساب."
                : "Enter your email and we'll send you a secure link to reset your password or activate your account."}
            </p>
          </div>

          <ForgotPasswordForm locale={locale} />
        </div>
      </FadeIn>
    </main>
  );
}