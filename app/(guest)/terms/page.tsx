import type { Metadata } from 'next';
import { FileText, LinkIcon } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/fade-in';
import { MarketingPageHero } from '@/components/marketing/page-hero';
import { marketingMetadata } from '@/lib/marketing/seo';
import { getAppLocale } from '@/lib/i18n/locale';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    titleAr: 'الشروط والأحكام | طاقم',
    titleEn: 'Terms & Conditions | Taqam',
    descriptionAr: 'نرجو مراجعة سياسات وشروط استخدام خدمات منصة طاقم.',
    descriptionEn: 'Please review policies and terms for using Taqam services.',
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
        icon={FileText}
        badge={isAr ? 'القانونية' : 'Legal'}
        title={isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}
        description={isAr ? 'نرجو مراجعة سياسات وشروط استخدام خدمات منصة طاقم.' : 'Please review policies and terms for using Taqam services.'}
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
                <FileText className="h-full w-full" />
              </div>
              <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-foreground">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                  1
                </span>
                {isAr ? 'القبول التام بالشروط' : 'Full Acceptance of Terms'}
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p key="0" className="leading-relaxed">{isAr ? 'باستخدامك لمنصة طاقم، فإنك توافق التامة على هذه الشروط والأحكام التي تخضع بدورها لقوانين المملكة العربية السعودية.' : 'باستخدامك لمنصة طاقم، فإنك توافق التامة على هذه الشروط والأحكام التي تخضع بدورها لقوانين المملكة العربية السعودية.'}</p>
              </div>
            </section>
          </StaggerItem>
          <StaggerItem key="1">
            <section className="relative overflow-hidden rounded-3xl border bg-card/40 backdrop-blur-sm p-8 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
              <div className="absolute -end-8 -top-8 text-9xl opacity-[0.02] mix-blend-overlay pointer-events-none">
                <FileText className="h-full w-full" />
              </div>
              <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-foreground">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                  2
                </span>
                {isAr ? 'الاستخدام المقبول والصحيح' : 'Acceptable & Proper Use'}
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p key="0" className="leading-relaxed">{isAr ? 'يُحظر استخدام المنصة لأي أغراض غير قانونية أو انتهاك حقوق الملكية الفكرية لطاقم أو الأطراف الثالثة أو لرفع بيانات زائفة عمداً.' : 'يُحظر استخدام المنصة لأي أغراض غير قانونية أو انتهاك حقوق الملكية الفكرية لطاقم أو الأطراف الثالثة أو لرفع بيانات زائفة عمداً.'}</p>
              </div>
            </section>
          </StaggerItem>
          <StaggerItem key="2">
            <section className="relative overflow-hidden rounded-3xl border bg-card/40 backdrop-blur-sm p-8 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
              <div className="absolute -end-8 -top-8 text-9xl opacity-[0.02] mix-blend-overlay pointer-events-none">
                <FileText className="h-full w-full" />
              </div>
              <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-foreground">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                  3
                </span>
                {isAr ? 'تنظيم الالتزامات وحدودها' : 'Liability & Limitations'}
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p key="0" className="leading-relaxed">{isAr ? 'تُقدم الخدمة "كما هي"، ونسعى جاهدين لضمان استمراريتها بنسبة 99.9%، لكننا لا نضمن عدم حدوث انقطاعات طارئة ناتجة عن أسباب قاهرة خارج سيطرتنا.' : 'تُقدم الخدمة "كما هي"، ونسعى جاهدين لضمان استمراريتها بنسبة 99.9%، لكننا لا نضمن عدم حدوث انقطاعات طارئة ناتجة عن أسباب قاهرة خارج سيطرتنا.'}</p>
              </div>
            </section>
          </StaggerItem>
          <StaggerItem key="3">
            <section className="relative overflow-hidden rounded-3xl border bg-card/40 backdrop-blur-sm p-8 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
              <div className="absolute -end-8 -top-8 text-9xl opacity-[0.02] mix-blend-overlay pointer-events-none">
                <FileText className="h-full w-full" />
              </div>
              <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-foreground">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                  4
                </span>
                {isAr ? 'سياسة الإلغاء والاشتراكات' : 'Cancellation & Subscriptions Policy'}
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p key="0" className="leading-relaxed">{isAr ? 'يُمكن للمشترك إلغاء باقته في أي وقت. يتم الاحتفاظ بالبيانات لمدة 90 يوماً بعد الإلغاء لسهولة الرجوع إليها، ثم تُهمل أو تُحذف بحسب الجاهزية والطلبات.' : 'يُمكن للمشترك إلغاء باقته في أي وقت. يتم الاحتفاظ بالبيانات لمدة 90 يوماً بعد الإلغاء لسهولة الرجوع إليها، ثم تُهمل أو تُحذف بحسب الجاهزية والطلبات.'}</p>
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
