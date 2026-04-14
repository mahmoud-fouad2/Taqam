import type { Metadata } from "next";
import { HelpCircle, MessageCircle } from "lucide-react";

import { MarketingPageCta } from "@/components/marketing/page-cta";
import { MarketingPageHero } from "@/components/marketing/page-hero";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { JsonLd } from "@/components/marketing/json-ld";
import { getFaqCategories } from "@/lib/marketing/faq";
import { faqSchema } from "@/lib/marketing/schema";
import { marketingMetadata } from "@/lib/marketing/seo";
import { getAppLocale } from "@/lib/i18n/locale";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    path: "/faq",
    titleAr: "الأسئلة الشائعة | طاقم",
    titleEn: "FAQ | Taqam",
    descriptionAr:
      "إجابات على الأسئلة الشائعة حول طاقم: البدء، الرواتب، الحضور، الإجازات، والأمان.",
    descriptionEn:
      "Frequently asked questions about Taqam: onboarding, payroll, attendance, leave, and security."
  });
}

export default async function FaqPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";
  const categories = await getFaqCategories();

  const allFaqs = categories.flatMap((c) =>
    c.faqs.map((f) => ({ q: isAr ? f.qAr : f.qEn, a: isAr ? f.aAr : f.aEn }))
  );

  return (
    <main className="bg-background">
      <JsonLd data={faqSchema(allFaqs)} />

      <FadeIn>
        <MarketingPageHero
          icon={HelpCircle}
          badge={isAr ? "إجابات مركزة وسريعة" : "Focused answers, fast access"}
          title={isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
          description={
            isAr
              ? "كل ما تحتاج معرفته عن طاقم في مكان واحد. لو سؤالك غير موجود هنا، تواصل معنا مباشرة أو انتقل لمركز المساعدة."
              : "Everything you need to know about Taqam in one place. If your question is not here, reach out directly or move to the help center."
          }
          actions={[
            {
              href: `${p}/help-center`,
              label: isAr ? "مركز المساعدة" : "Help Center",
              variant: "brand"
            },
            {
              href: `${p}/request-demo`,
              label: isAr ? "اطلب عرضًا" : "Request a demo",
              variant: "outline"
            }
          ]}
          stats={[
            { value: `${categories.length}`, label: isAr ? "فئات" : "Categories" },
            { value: `${allFaqs.length}+`, label: isAr ? "إجابة" : "Answers" },
            { value: isAr ? "ثنائي اللغة" : "Bilingual", label: isAr ? "اللغة" : "Language" }
          ]}
        />
      </FadeIn>

      {/* ── FAQ CATEGORIES ── */}
      <section className="container mx-auto px-4 py-14">
        <StaggerContainer className="mx-auto max-w-3xl space-y-8">
          {categories.map((cat) => (
            <StaggerItem key={cat.titleEn}>
              <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
                {/* Category header */}
                <div className="bg-muted/40 flex items-center gap-3 border-b px-5 py-4">
                  <div>
                    <h2 className="font-semibold">{isAr ? cat.titleAr : cat.titleEn}</h2>
                    <p className="text-muted-foreground text-xs">
                      {isAr ? cat.titleEn : cat.titleAr}
                    </p>
                  </div>
                  <span className="bg-primary/10 text-primary ms-auto rounded-full px-2.5 py-0.5 text-xs font-medium">
                    {cat.faqs.length}
                  </span>
                </div>
                {/* Accordion */}
                <div className="px-2 py-1">
                  <Accordion type="single" collapsible>
                    {cat.faqs.map((f, idx) => (
                      <AccordionItem
                        key={idx}
                        value={`${cat.titleEn}-${idx}`}
                        className="border-b last:border-b-0">
                        <AccordionTrigger className="px-3 text-start leading-snug hover:no-underline">
                          {isAr ? f.qAr : f.qEn}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground px-3 pb-4 leading-relaxed">
                          {isAr ? f.aAr : f.aEn}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      <FadeIn>
        <MarketingPageCta
          icon={MessageCircle}
          title={isAr ? "لم تجد إجابتك؟" : "Still have questions?"}
          description={
            isAr
              ? "فريق الدعم جاهز يساعدك في الأسئلة التشغيلية أو طلبات التفعيل، ويمكننا أيضًا ترتيب عرض عملي إذا كنت تقيم المنصة."
              : "The support team can help with operational questions or activation issues, and we can also arrange a practical demo if you're still evaluating the platform."
          }
          primaryAction={{
            href: `${p}/support`,
            label: isAr ? "تواصل مع الدعم" : "Contact support"
          }}
          secondaryAction={{
            href: `${p}/request-demo`,
            label: isAr ? "اطلب عرضًا" : "Request a demo"
          }}
        />
      </FadeIn>
    </main>
  );
}
