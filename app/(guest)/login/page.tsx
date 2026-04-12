import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo-mark";
import { generateMeta } from "@/lib/utils";
import { getAppLocale } from "@/lib/i18n/locale";
import { getText } from "@/lib/i18n/text";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { FadeIn } from "@/components/ui/fade-in";
import { getCurrentUser } from "@/lib/auth";
import { buildTenantPath, buildTenantUrl, isLocalTenantDevelopmentHost } from "@/lib/tenant";
import { getTenantRequestHost } from "@/lib/tenant.server";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAppLocale();
  const t = getText(locale);
  return generateMeta({
    title: t.login.metaTitle,
    description: t.login.metaDescription
  });
}

export default async function LoginPageV1() {
  const locale = await getAppLocale();
  const user = await getCurrentUser();
  if (user?.role === "SUPER_ADMIN") {
    redirect("/dashboard/super-admin");
  }

  if (user?.tenantId && user.tenant?.slug) {
    const requestHost = await getTenantRequestHost();
    if (isLocalTenantDevelopmentHost(requestHost)) {
      redirect(buildTenantPath(user.tenant.slug, "/dashboard", locale));
    }

    redirect(buildTenantUrl(user.tenant.slug, "/dashboard", requestHost));
  }

  if (user?.tenantId) {
    redirect("/dashboard");
  }
  const t = getText(locale);
  const prefix = locale === "en" ? "/en" : "";

  return (
    <div className="bg-background min-h-screen">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left: form */}
        <div className="relative flex items-center justify-center px-6 py-10 lg:px-12">
          <FadeIn direction="up">
            <div className="w-full max-w-md">
              <div className="border-border/60 bg-card/80 rounded-[2rem] border p-6 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-8">
                <div className="text-center">
                  <div className="mb-6 flex justify-center">
                    <LogoMark frameClassName="rounded-2xl p-0 shadow-md" imageClassName="h-16" />
                  </div>
                  <h1 className="text-3xl font-semibold tracking-tight">{t.login.title}</h1>
                  <p className="text-muted-foreground mt-2 text-sm">{t.login.subtitle}</p>

                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    {[
                      locale === "ar" ? "حماية الدخول" : "Protected access",
                      locale === "ar" ? "دخول عربي / إنجليزي" : "Arabic / English",
                      locale === "ar" ? "تحقق Google" : "Google verification"
                    ].map((item) => (
                      <span
                        key={item}
                        className="border-border/60 bg-background/85 text-muted-foreground inline-flex items-center justify-center rounded-full border px-3 py-2 text-[11px] font-medium">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <LoginForm
                  locale={locale}
                  labels={{
                    email: t.login.email,
                    emailPlaceholder: t.login.emailPlaceholder,
                    password: t.login.password,
                    passwordPlaceholder: t.login.passwordPlaceholder,
                    submit: t.login.submit
                  }}
                />

                <div className="mt-6 flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-muted-foreground text-sm">
                    {locale === "ar"
                      ? "تحتاج حسابًا جديدًا أو عرضًا سريعًا؟"
                      : "Need a new account or a quick walkthrough?"}
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button asChild variant="brandOutline" className="h-10 rounded-xl">
                      <Link href={`${prefix}/request-demo`}>
                        {locale === "ar" ? "طلب عرض تجريبي" : "Request a demo"}
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" className="h-10 rounded-xl">
                      <Link href={`${prefix}/pricing`}>
                        {locale === "ar" ? "عرض الأسعار" : "View pricing"}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Right: dark marketing panel */}
        <div className="border-border/60 relative hidden overflow-hidden rounded-s-[2rem] border-s bg-gradient-to-br from-sky-50 via-white to-indigo-50/80 lg:block dark:border-white/10 dark:from-neutral-950 dark:via-neutral-900 dark:to-slate-900">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-200/80 via-sky-50/50 to-indigo-100/70 dark:from-indigo-900/20 dark:via-transparent dark:to-transparent" />
          <div className="marketing-grid-pattern absolute inset-0 opacity-[0.03] dark:opacity-[0.03]" />

          <div className="relative flex h-full flex-col justify-center px-14">
            <div className="mb-10 flex items-center gap-3">
              <LogoMark frameClassName="rounded-xl p-0" imageClassName="h-10" />
            </div>

            <div className="text-slate-950 dark:text-white">
              <div className="text-4xl leading-tight font-bold tracking-tight">
                {t.login.rightTitle}
              </div>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-white/70">
                {t.login.rightLead}
              </p>

              <div className="mt-8 space-y-3">
                {t.login.rightBullets.map((line: string) => (
                  <div key={line} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/15 dark:bg-indigo-500/30">
                      <div className="h-1.5 w-1.5 rounded-full bg-sky-600 dark:bg-indigo-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-800 dark:text-white/90">
                      {line}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-8 text-xs text-slate-500 dark:text-white/50">{t.login.rightHint}</p>
            </div>

            <div className="mt-10 max-w-sm rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-lg shadow-sky-100/40 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {t.login.promoTitle}
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-white/60">
                {t.login.promoBody}
              </div>
              <div className="mt-4">
                <Button
                  variant="brandOutline"
                  className="border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:hover:text-white">
                  {t.login.promoCta}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
