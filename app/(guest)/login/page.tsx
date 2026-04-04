import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo-mark";
import { generateMeta } from "@/lib/utils";
import { getAppLocale } from "@/lib/i18n/locale";
import { getText } from "@/lib/i18n/text";
import { Metadata } from "next";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAppLocale();
  const t = getText(locale);
  return generateMeta({
    title: t.login.metaTitle,
    description: t.login.metaDescription,
  });
}

export default async function LoginPageV1() {
  const locale = await getAppLocale();
  const t = getText(locale);

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left: form */}
        <div className="relative flex items-center justify-center px-6 py-10 lg:px-12">
          <div className="w-full max-w-md">
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <LogoMark frameClassName="rounded-2xl p-0 shadow-md" imageClassName="h-16" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">{t.login.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t.login.subtitle}</p>
            </div>

            <LoginForm
              locale={locale}
              labels={{
                email: t.login.email,
                emailPlaceholder: t.login.emailPlaceholder,
                password: t.login.password,
                passwordPlaceholder: t.login.passwordPlaceholder,
                submit: t.login.submit,
              }}
            />
          </div>
        </div>

        {/* Right: dark marketing panel */}
        <div className="relative hidden overflow-hidden rounded-s-[2rem] border-s border-border/60 bg-gradient-to-br from-sky-50 via-white to-indigo-50/80 lg:block dark:border-white/10 dark:bg-neutral-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-200/80 via-white to-indigo-100/70 dark:from-indigo-900/60 dark:via-neutral-950 dark:to-neutral-950" />
          <div className="marketing-grid-pattern absolute inset-0 opacity-[0.03] dark:opacity-[0.03]" />

          <div className="relative flex h-full flex-col justify-center px-14">
            <div className="mb-10 flex items-center gap-3">
              <LogoMark frameClassName="rounded-xl p-0" imageClassName="h-10" />
            </div>

            <div className="text-slate-950 dark:text-white">
              <div className="text-4xl font-bold leading-tight tracking-tight">{t.login.rightTitle}</div>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-white/70">{t.login.rightLead}</p>

              <div className="mt-8 space-y-3">
                {t.login.rightBullets.map((line: string) => (
                  <div key={line} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/15 dark:bg-indigo-500/30">
                      <div className="h-1.5 w-1.5 rounded-full bg-sky-600 dark:bg-indigo-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-800 dark:text-white/90">{line}</span>
                  </div>
                ))}
              </div>

              <p className="mt-8 text-xs text-slate-500 dark:text-white/50">{t.login.rightHint}</p>
            </div>

            <div className="mt-10 max-w-sm rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-lg shadow-sky-100/40 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">{t.login.promoTitle}</div>
              <div className="mt-2 text-sm text-slate-600 dark:text-white/60">{t.login.promoBody}</div>
              <div className="mt-4">
                <Button variant="brandOutline" className="border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:hover:text-white">
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
