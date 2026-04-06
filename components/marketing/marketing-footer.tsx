import Link from "next/link";
import Image from "next/image";

import { LogoMark } from "@/components/logo-mark";
import { getAppLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";

export async function MarketingFooter() {
  const year = new Date().getFullYear();
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";
  const legalLinks = [
    { href: `${p}/privacy`, label: t(locale, "footer.privacy") },
    { href: `${p}/terms`, label: t(locale, "footer.terms") },
  ];
  const summary = isAr
    ? "يشغّل شؤون الموظفين والرواتب والحضور للشركات السعودية من مساحة واحدة واضحة وسريعة."
    : "A clear workspace for HR operations, payroll, and attendance built for Saudi businesses.";
  const highlights = isAr
    ? ["الموظفون", "الرواتب", "الحضور"]
    : ["People", "Payroll", "Attendance"];
  const rights = isAr ? "طاقم. جميع الحقوق محفوظة." : "Taqam. All rights reserved.";
  const supportLine = t(locale, "footer.developedBy");

  return (
    <footer className="border-t bg-background/95">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-muted/20 px-4 py-4 shadow-sm sm:px-5 sm:py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3 sm:gap-4">
              <Link href={p || "/"} className="inline-flex shrink-0 transition hover:opacity-90">
                <LogoMark frameClassName="size-12 rounded-2xl p-0 dark:ring-white/10" imageClassName="h-7" />
              </Link>

              <div className="space-y-2 text-start">
                <p className="text-sm font-semibold text-foreground sm:text-base">
                  {isAr ? "طاقم" : "Taqam"}
                </p>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                  {summary}
                </p>
                <div className="flex flex-wrap gap-2">
                  {highlights.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground md:max-w-xs md:justify-end">
              {legalLinks.map((link) => (
                <Link key={link.href} href={link.href} className="transition hover:text-foreground">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>© {year} {rights}</span>
            <Link
              href="https://ma-fo.info"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-80"
            >
              <Image
                src="https://ma-fo.info/favicon.ico"
                alt="ma-fo.info"
                width={14}
                height={14}
                className="rounded-sm"
                unoptimized
              />
              <span>{supportLine}</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
