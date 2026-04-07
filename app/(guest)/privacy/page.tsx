import type { Metadata } from 'next';
import { ShieldCheck, LinkIcon } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/fade-in';
import { MarketingPageHero } from '@/components/marketing/page-hero';
import { marketingMetadata } from '@/lib/marketing/seo';
import { getAppLocale } from '@/lib/i18n/locale';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    titleAr: 'سياسة الخصوصية | طاقم',
    titleEn: 'Privacy Policy | Taqam',
    descriptionAr: 'تعرف على كيفية حماية منصة طاقم لبيانات شركتك وكيفية معالجتها.',
    descriptionEn: 'Understand how Taqam protects your company data and processes it.',
    path: '',
  });
}

export default async function Page() {
  const locale = await getAppLocale();
  const isAr = locale === 'ar';
  const p = locale === 'en' ? '/en' : '';
  const dir = isAr ? 'rtl' : 'ltr';

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir={dir}>
      <MarketingPageHero
        icon={ShieldCheck}
        badge={isAr ? 'القانونية' : 'Legal'}
        title={isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
        description={isAr ? 'تعرف على كيفية حماية منصة طاقم لبيانات شركتك وكيفية معالجتها.' : 'Understand how Taqam protects your company data and processes it.'}
        actions={[
          { href: `${p}/support`, label: isAr ? 'تواصل معنا' : 'Contact us', variant: 'outline' },
          { href: `${p}/request-demo`, label: isAr ? 'اطلب عرضًا' : 'Request demo', variant: 'brand' },
        ]}
      />

      <div className="container mx-auto max-w-4xl px-4 py-12">
        <StaggerContainer className="space-y-8">
          
          <StaggerItem key="0">
            <section className="relative overflow-hidden rounded-3xl border bg-card/40 backdrop-blur-sm p-8 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
              <div className="absolute -end-8 -top-8 text-9xl opacity-[0.02] mix-blend-overlay pointer-events-none">
                <ShieldCheck className="h-full w-full" />
              </div>
              <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-foreground">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                  1
                </span>
                {isAr ? 'المعلومات التي نجمعها' : 'Information We Collect'}
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p key="0" className="leading-relaxed">{isAr ? 'نجمع البيانات الأساسية لتوفير الخدمة بشكل مثالي:' : 'نجمع البيانات الأساسية لتوفير الخدمة بشكل مثالي:'}</p><ul key="1" className="ms-4 list-disc space-y-2 pe-4 marker:text-primary/40"><li key="0">{isAr ? 'بيانات الحساب: الاسم، البريد الإلكتروني، واسم الشركة وموثوقيتها.' : 'بيانات الحساب: الاسم، البريد الإلكتروني، واسم الشركة وموثوقيتها.'}</li><li key="1">{isAr ? 'بيانات الموظفين: والتي تبقى في بيئة معزولة تماماً تتبع لمعايير الأمان المتقدمة.' : 'بيانات الموظفين: والتي تبقى في بيئة معزولة تماماً تتبع لمعايير الأمان المتقدمة.'}</li></ul>
              </div>
            </section>
          </StaggerItem>
          <StaggerItem key="1">
            <section className="relative overflow-hidden rounded-3xl border bg-card/40 backdrop-blur-sm p-8 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
              <div className="absolute -end-8 -top-8 text-9xl opacity-[0.02] mix-blend-overlay pointer-events-none">
                <ShieldCheck className="h-full w-full" />
              </div>
              <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-foreground">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                  2
                </span>
                {isAr ? 'كيف نستخدم البيانات للشركات' : 'How We Use Company Data'}
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p key="0" className="leading-relaxed">{isAr ? 'تستخدم طاقم البيانات حصرياً من أجل الغرض الذي أُنشئت له عبر:' : 'تستخدم طاقم البيانات حصرياً من أجل الغرض الذي أُنشئت له عبر:'}</p><ul key="1" className="ms-4 list-disc space-y-2 pe-4 marker:text-primary/40"><li key="0">{isAr ? 'توفير استقرار الخدمة ومعالجة الرواتب بدقة عالية ومزايا متوافقة.' : 'توفير استقرار الخدمة ومعالجة الرواتب بدقة عالية ومزايا متوافقة.'}</li><li key="1">{isAr ? 'التواصل مع المشرفين بخصوص التحديثات والتنبيهات الدورية.' : 'التواصل مع المشرفين بخصوص التحديثات والتنبيهات الدورية.'}</li></ul>
              </div>
            </section>
          </StaggerItem>
          <StaggerItem key="2">
            <section className="relative overflow-hidden rounded-3xl border bg-card/40 backdrop-blur-sm p-8 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
              <div className="absolute -end-8 -top-8 text-9xl opacity-[0.02] mix-blend-overlay pointer-events-none">
                <ShieldCheck className="h-full w-full" />
              </div>
              <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-foreground">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                  3
                </span>
                {isAr ? 'الحماية والأمان المتكامل' : 'Integrated Protection & Security'}
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p key="0" className="leading-relaxed">{isAr ? 'نستخدم معايير تشفير متقدمة (TLS/HTTPS) بالإضافة إلى العزل الكامل (Multi-tenant isolation) لضمان أعلى مستويات الأمان والاستقرار.' : 'نستخدم معايير تشفير متقدمة (TLS/HTTPS) بالإضافة إلى العزل الكامل (Multi-tenant isolation) لضمان أعلى مستويات الأمان والاستقرار.'}</p>
              </div>
            </section>
          </StaggerItem>
          <StaggerItem key="3">
            <section className="relative overflow-hidden rounded-3xl border bg-card/40 backdrop-blur-sm p-8 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
              <div className="absolute -end-8 -top-8 text-9xl opacity-[0.02] mix-blend-overlay pointer-events-none">
                <ShieldCheck className="h-full w-full" />
              </div>
              <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-foreground">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                  4
                </span>
                {isAr ? 'مشاركة البيانات' : 'Data Sharing'}
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p key="0" className="leading-relaxed">{isAr ? 'نحن لا نبيع أي بيانات أو نشاركها لأغراض تسويقية مطلقاً. فقط نشاركها في الاستثناءات التالية:' : 'نحن لا نبيع أي بيانات أو نشاركها لأغراض تسويقية مطلقاً. فقط نشاركها في الاستثناءات التالية:'}</p><ul key="1" className="ms-4 list-disc space-y-2 pe-4 marker:text-primary/40"><li key="0">{isAr ? 'تكاملات دفع مرخصة وتتم بموافقتكم.' : 'تكاملات دفع مرخصة وتتم بموافقتكم.'}</li><li key="1">{isAr ? 'جهات حكومية وتنظيمية، عندما يكون هناك طلب رسمي وقانوني واضح.' : 'جهات حكومية وتنظيمية، عندما يكون هناك طلب رسمي وقانوني واضح.'}</li></ul>
              </div>
            </section>
          </StaggerItem>
        </StaggerContainer>

        <FadeIn direction="up">
          <div className="mt-12 rounded-3xl border bg-gradient-to-b from-primary/10 to-transparent p-12 text-center shadow-lg dark:from-primary/20 dark:to-transparent">
            <h3 className="mb-3 text-2xl font-bold">{isAr ? 'أسئلة؟' : 'Questions?'}</h3>
            <p className="mb-6 text-muted-foreground">
              {isAr ? 'فريقنا جاهز للمساعدة في أي استفسارات' : 'Our team is ready to help with any inquiries'}
            </p>
            <Button asChild size="lg" className="rounded-full px-8 shadow-md">
              <Link href={`${p}/support`}>{isAr ? 'اتصل بنا' : 'Contact Us'}</Link>
            </Button>
          </div>
        </FadeIn>
      </div>
    </main>
  );
}
