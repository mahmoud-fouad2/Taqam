import Link from "next/link";
import { generateMeta } from "@/lib/utils";
import { Metadata } from "next";
import Image from "next/image";
import { getAppLocale } from "@/lib/i18n/locale";
import { getText } from "@/lib/i18n/text";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { FadeIn } from "@/components/ui/fade-in";

import { RegisterForm } from "./register-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAppLocale();
  const t = getText(locale);
  return generateMeta({
    title: t.register.metaTitle,
    description: t.register.metaDescription
  });
}

export default async function RegisterPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  const prefix = locale === "en" ? "/en" : "";

  return (
    <div className="flex pb-8 lg:h-screen lg:pb-0">
      <div className="hidden w-1/2 bg-gray-100 lg:block">
        <Image
          src="/images/cover.png"
          alt="Cover"
          fill
          className="object-cover"
          sizes="50vw"
          priority
        />
      </div>

      <div className="flex w-full items-center justify-center lg:w-1/2">
        <FadeIn direction="up">
          <div className="w-full max-w-lg space-y-8 px-4">
            <div className={`flex gap-2 ${locale === "ar" ? "justify-start" : "justify-end"}`}>
              <ThemeToggle variant="ghost" />
              <LocaleToggle variant="ghost" initialLocale={locale} />
            </div>

            <div className="text-center">
              <h2 className="mt-6 text-3xl font-bold text-gray-900">{t.register.title}</h2>
              <p className="mt-2 text-sm text-gray-600">{t.register.subtitle}</p>
            </div>

            <div className="mt-8 space-y-6">
              <RegisterForm
                locale={locale}
                labels={{
                  summary: t.register.summary,
                  steps: [t.register.stepOne, t.register.stepTwo, t.register.stepThree],
                  primaryAction: t.register.primaryAction,
                  secondaryAction: t.register.secondaryAction,
                  inviteNote: t.register.inviteNote
                }}
              />
            </div>

            <div className="mt-6">
              <p className="mt-6 text-center text-sm text-gray-600">
                {t.register.alreadyHaveAccount}{" "}
                <Link href={`${prefix}/login`} className="text-primary hover:underline">
                  {t.register.loginLink}
                </Link>
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
