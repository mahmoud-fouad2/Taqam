import { getAppLocale } from "@/lib/i18n/locale";
import { getText } from "@/lib/i18n/text";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const releaseHighlights = [
  {
    key: "operations",
    titleAr: "الاعتمادية والبنية التشغيلية",
    titleEn: "Reliability and operations",
    summaryAr: "المسار التشغيلي الحالي يعتمد على تحقق كامل قبل الإطلاق ومسار بناء متوافق محليًا وعلى Render.",
    summaryEn: "The current release path uses full validation before shipping and a build flow that works locally and on Render.",
    itemsAr: [
      "التحقق الكامل يشمل TypeScript و ESLint والاختبارات والبناء وفحص تطبيق الموبايل.",
      "البناء المحلي على ويندوز أصبح مستقرًا بدون كسر مسار Render و CI.",
      "محدد المعدل يدعم Redis في الإنتاج مع fallback آمن أثناء التطوير أو عند غياب الإعدادات.",
    ],
    itemsEn: [
      "Full validation covers TypeScript, ESLint, tests, the production build, and the mobile typecheck.",
      "Local Windows builds now complete reliably without changing the Render and CI deployment path.",
      "Rate limiting supports Redis in production with a safe fallback during development or when Redis is not configured.",
    ],
  },
  {
    key: "people",
    titleAr: "عمليات الموظفين والمستخدمين",
    titleEn: "Employee and user operations",
    summaryAr: "الإجراءات الأساسية التي كانت محاكاة فقط أصبحت تتعامل مع الـ APIs الحقيقية وتنعكس على البيانات مباشرة.",
    summaryEn: "Core operations that previously stopped at UI simulation now execute against the live APIs and persist real data.",
    itemsAr: [
      "استيراد الموظفين عبر CSV ينفذ صفًا بصف ويعرض نتيجة كل سجل فعليًا.",
      "حذف المستخدمين من لوحة التحكم ينفذ على الـ API ويحدّث الشاشة بعد النجاح.",
      "إنشاء الموظف يدعم مطابقة القسم والمسمى والفرع عبر الأكواد المستخدمة في ملفات الاستيراد.",
    ],
    itemsEn: [
      "CSV employee import now processes records one by one and reports the real status of each row.",
      "Dashboard user deletion now calls the live API and refreshes the view after a successful response.",
      "Employee creation supports resolving department, job title, and branch codes used by import files.",
    ],
  },
  {
    key: "admin",
    titleAr: "الإدارة والمتابعة",
    titleEn: "Administration and visibility",
    summaryAr: "الواجهات الإدارية الحالية تعرض بيانات حقيقية من النظام بدل النصوص المؤقتة أو السجلات المصطنعة.",
    summaryEn: "Current admin screens now surface real system data instead of temporary copy or fabricated activity entries.",
    itemsAr: [
      "تفاصيل الشركة في السوبر أدمن تعرض المستخدمين المرتبطين فعليًا بالشركة مع آخر دخول وحالة كل حساب.",
      "تبويب سجل التغييرات يقرأ من audit logs الحقيقية للشركة نفسها.",
      "صفحة ما الجديد تعرض فقط التحديثات الموجودة بالفعل في النسخة الحالية.",
    ],
    itemsEn: [
      "Super admin tenant details now show the real users attached to the tenant with account state and last login.",
      "The audit tab reads the tenant's actual audit log entries.",
      "The what's new screen now documents only changes that are actually present in the current build.",
    ],
  },
];

export default async function WhatsNewPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  const isAr = locale === "ar";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-start">{t.common.whatsNew}</h1>
        <p className="text-muted-foreground">
          {isAr
            ? "هذه الصفحة تعرض فقط التحسينات المفعلة فعليًا في النسخة الحالية من المنصة."
            : "This page lists only the changes that are actually active in the current platform build."}
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {releaseHighlights.map((section) => (
          <Card key={section.key}>
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle>{isAr ? section.titleAr : section.titleEn}</CardTitle>
                <Badge variant="secondary">{isAr ? "مفعّل الآن" : "Live now"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {isAr ? section.summaryAr : section.summaryEn}
              </p>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 ps-5 text-sm text-muted-foreground">
                {(isAr ? section.itemsAr : section.itemsEn).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
