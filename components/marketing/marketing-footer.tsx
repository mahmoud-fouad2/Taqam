import Image from "next/image";
import Link from "next/link";

import { getAppLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";

export async function MarketingFooter() {
  const year = new Date().getFullYear();
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";
  const footerLinks = [
    { href: `${p}/features`, label: isAr ? "المميزات" : "Features" },
    { href: `${p}/pricing`, label: isAr ? "الأسعار" : "Pricing" },
    { href: `${p}/plans`, label: isAr ? "الباقات" : "Plans" },
    { href: `${p}/faq`, label: isAr ? "الأسئلة الشائعة" : "FAQ" },
    { href: `${p}/support`, label: isAr ? "الدعم الفني" : "Support" },
    { href: `${p}/privacy`, label: t(locale, "footer.privacy") },
    { href: `${p}/terms`, label: t(locale, "footer.terms") },
  ];
  const stack = isAr ? t(locale, "footer.stack.ar") : t(locale, "footer.stack.en");

  return (
    <footer className="border-t bg-background/80">
      <div className="container mx-auto px-4 py-8 sm:py-10">
        <div className="flex flex-col gap-5">
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground sm:gap-x-5">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="rounded-3xl border border-border/70 bg-muted/20 px-5 py-5 shadow-sm">
            <div className="flex flex-col items-center gap-3 text-center">
              <Link href={p || "/"} className="inline-flex items-center justify-center transition hover:opacity-90">
                <span className="relative h-10 w-[150px] sm:h-12 sm:w-[190px]">
                  <Image
                    src="/icons/logo-navbar-light-512.png"
                    alt="Taqam"
                    fill
                    sizes="190px"
                    className="object-contain dark:hidden"
                  />
                  <Image
                    src="/icons/logo-navbar-dark-512.png"
                    alt="Taqam"
                    fill
                    sizes="190px"
                    className="hidden object-contain dark:block"
                  />
                </span>
              </Link>

              <p className="max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">
                {isAr
                  ? "منصة موارد بشرية ورواتب وحضور مصممة للشركات في السعودية، بواجهة ثنائية اللغة وتجربة تشغيل عملية وواضحة."
                  : "A Saudi HR, payroll, and attendance platform with bilingual UX and a practical operating experience."}
              </p>

              <p className="text-[11px] text-muted-foreground sm:text-xs">{stack}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t pt-3 text-[11px] text-muted-foreground sm:text-xs">
            <span>© {year} {t(locale, "footer.rights")}</span>
            <span className="opacity-35">•</span>
            <Link
              href="https://ma-fo.info"
              className="transition hover:text-foreground"
              target="_blank"
              rel="noreferrer"
            >
              {t(locale, "footer.developedBy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
