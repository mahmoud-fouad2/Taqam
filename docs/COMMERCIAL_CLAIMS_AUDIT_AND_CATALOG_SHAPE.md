# Commercial Claims Audit And Catalog Shape

> التاريخ: 2026-04-13
> الغرض: حصر أماكن الوعود التجارية الحالية في الكود، ثم تعريف شكل موحد لـ `Feature Catalog` و`Claims Registry` قبل البدء في الترحيل التدريجي.

## 1. السطح التجاري الحالي

### 1.1 مصدر مركزي موجود جزئياً

- [lib/marketing/site-content.ts](../lib/marketing/site-content.ts): يدير نصوص `home/pricing/careers/request-demo` والـ SEO الافتراضي.
- [lib/marketing/pricing.ts](../lib/marketing/pricing.ts): يدير الباقات وصفوف المقارنة كمصدر شبه مركزي للـ pricing surfaces.

### 1.2 أماكن claims ما زالت hardcoded أو موزعة

- [app/(guest)/page.tsx](<../app/(guest)/page.tsx>): السطح الرئيسي أصبح مرتبطاً بدرجة جيدة بمصادر موحدة، لكن ما يزال presentation layer نفسه page-local كما هو متوقع.
- [app/(guest)/features/page.tsx](<../app/(guest)/features/page.tsx>): تم ترحيل `suite catalog` إلى source موحد داخل `commercial-registry` (Feature Suites registry)، والصفحة أصبحت registry-backed على مستوى copy/claims مع بقاء presentation layer محلياً.
- [app/(guest)/pricing/page.tsx](<../app/(guest)/pricing/page.tsx>): الباقات والمقارنة وframing الأساسي أصبحت في source مشترك، لكن لم تُربط بعد بالكامل بـ Feature Catalog / Claims Registry.
- [app/(guest)/plans/page.tsx](<../app/(guest)/plans/page.tsx>): صارت تعتمد على source pricing المشترك في الباقات والـ framing الأساسي، لكن لم تُربط بعد بالكامل بـ claims registry نفسها.
- [app/(guest)/careers/page.tsx](<../app/(guest)/careers/page.tsx>): hero مركزي، لكن differentiator framing والإحصاءات والعناصر المساندة ما زالت محلية.

## 2. المشاكل الحالية

- نفس capability تُوصف بأسماء مختلفة بين الصفحات.
  - أمثلة واضحة: payroll / WPS / GOSI / recruitment / analytics / mobile scope.
- plan features حالياً free-text وليست مرتبطة بمعرّفات ثابتة.
- لا يوجد ربط بين claim وبين:
  - capability حقيقية في المنتج
  - plan availability
  - proof path أو owner واضح
- لا توجد gate صريحة تمنع claim من الظهور قبل أن تكون حالته `live` فعلاً.

## 3. الاستنتاج العملي من الـ audit

- `site-content` مناسب للنص البنيوي العام للصفحة: hero, CTA, SEO, section headers.
- `pricing` مناسب كبداية لـ commercial packaging، لكنه ما زال نصيًا أكثر من كونه catalog structured.
- الصفحة الرئيسية و`features` هما أكبر مصدرين لانفلات claims حالياً، ولذلك يجب أن تكونا أول مرحلتين في الترحيل لاحقاً.

## 4. الشكل المقترح لـ Feature Catalog

كل feature يجب أن تملك record ثابتًا بهذا المستوى على الأقل:

- `id`: معرف ثابت مثل `core-hr.employee-profiles`
- `family`: `core-hr | attendance | payroll-compliance | mobile | recruitment | analytics | integrations | automation`
- `nameAr`
- `nameEn`
- `summaryAr`
- `summaryEn`
- `status`: `live | beta | gated | planned`
- `commercialTier`: `core | advanced | differentiator | add-on`
- `planAvailability`: starter / business / enterprise / add-on
- `evidence`: مسارات أو modules أو APIs تثبت أن capability موجودة فعلاً
- `owner`: الفريق أو المسار المسؤول عن صحتها

## 5. الشكل المقترح لـ Claims Registry

الـ claim لا يمثل capability بحد ذاته، بل صياغة تسويقية مرتبطة بواحدة أو أكثر من capabilities.

كل claim يجب أن يملك record ثابتًا بهذا المستوى:

- `id`: مثل `home.hero.saudi-compliance`
- `surface`: مثل `home.hero`, `home.feature-grid`, `pricing.card`, `features.suite`, `careers.differentiator`
- `slot`: ترتيب أو موضع الظهور داخل السطح
- `titleAr`
- `titleEn`
- `descriptionAr`
- `descriptionEn`
- `linkedFeatureIds`: قائمة features التي تبرر claim
- `strength`: `core | supporting | differentiator`
- `visibility`: `public | sales-assisted | enterprise-only`
- `statusGate`: `live-only | allow-beta | internal-only`

## 6. قاعدة الفصل بين الطبقات

- `site-content`: النص البنيوي العام للصفحة.
- `feature catalog`: ما الذي يقدمه المنتج فعليًا وبأي حالة.
- `claims registry`: كيف نعرض هذه القدرات تجاريًا على كل surface.
- `pricing plans`: ما الذي يدخل في كل plan من خلال feature ids، لا عبر نصوص حرة فقط.

## 7. الترحيل الآمن المقترح

1. إنشاء schema/types أولية للـ `feature catalog` و`claims registry` داخل `lib/marketing/`.
2. ترحيل `home feature grid` و`home integrations` أولًا لأنهما أكبر مصدر duplication.
3. ترحيل `features page suites` إلى claims مبنية على feature ids.
4. ربط `pricing plans` و`comparison rows` بمعرّفات catalog تدريجيًا بدل الاعتماد الكامل على text arrays.
5. بعد ثبات الـ model، نفتح review surface في السوبر أدمن قبل أي CRUD no-code كامل.

## 8. القرار التنفيذي التالي

الخطوة التالية الموصى بها ليست UI جديدة الآن، بل:

- تعريف schema/types أولية للـ catalog/registry في الكود
- ثم ترحيل homepage claims عليها تدريجيًا

هذا الترتيب يعطي مصدر حقيقة واحد قبل فتح no-code إدارة claims على السوبر أدمن.

## 9. التقدم المنفذ بعد الـ audit

- تم إنشاء contract أولي في [lib/marketing/commercial-registry.ts](../lib/marketing/commercial-registry.ts).
- تم ترحيل `home feature grid` في [app/(guest)/page.tsx](<../app/(guest)/page.tsx>) ليقرأ من `Claims Registry` بدل النصوص الحرة.
- تم توحيد بطاقات الباقات في [app/(guest)/page.tsx](<../app/(guest)/page.tsx>) مع [lib/marketing/pricing.ts](../lib/marketing/pricing.ts).
- تم نقل `homepage integrations showcase` إلى مصدر مركزي داخل [lib/marketing/commercial-registry.ts](../lib/marketing/commercial-registry.ts) مع readiness صريحة تميّز بين `live` و`enterprise custom`.
- تم نقل `homepage trust/proof surfaces` في [app/(guest)/page.tsx](<../app/(guest)/page.tsx>) إلى `Claims Registry` بدل arrays page-local.
- تم توحيد `homepage personas` داخل [lib/marketing/commercial-registry.ts](../lib/marketing/commercial-registry.ts) عبر model منفصل للـ persona showcase، مع إبقاء الصور والتراكيب البصرية في [app/(guest)/page.tsx](<../app/(guest)/page.tsx>).
- تم نقل `homepage testimonials` إلى مصدر مركزي داخل [lib/marketing/commercial-registry.ts](../lib/marketing/commercial-registry.ts) مع `linkedFeatureIds` وguardrail test يمنع ظهور social proof غير مربوط بقدرات live.
- تم سحب framing المحلي المتبقي في [app/(guest)/pricing/page.tsx](<../app/(guest)/pricing/page.tsx>) و[app/(guest)/plans/page.tsx](<../app/(guest)/plans/page.tsx>) إلى مصدر مشترك داخل [lib/marketing/pricing.ts](../lib/marketing/pricing.ts).
- تم نقل أول slice من [app/(guest)/features/page.tsx](<../app/(guest)/features/page.tsx>) إلى `Claims Registry` وتشمل: `features hero` و`platform anatomy` و`platform highlights`.
- تم ترحيل `features suite catalog` بالكامل إلى `Feature Suites registry` داخل [lib/marketing/commercial-registry.ts](../lib/marketing/commercial-registry.ts) مع guardrail tests لمنع drift.
- بقيت surfaces التالية خارج المصدر الموحد حتى الآن:
  - أجزاء ثانوية من `plans page` إذا قررنا ربطها لاحقًا بالـ claims registry بدل source pricing المشترك فقط

## 10. مصفوفة ملكية الأسطح (Surface Ownership Matrix)

> الهدف: نعرف ما الذي يجب أن يُدار من السوبر أدمن (no-code) وما الذي يبقى هندسياً حتى لا تتحول البيانات التجارية إلى فوضى.

### 10.1 مصادر الحقيقة الحالية (منفذة)

- **Site content (عناوين/وصف/CTA/SEO الأساسي)**
  - المصدر: [lib/marketing/site-content.ts](../lib/marketing/site-content.ts) + schema: [lib/marketing/site-content-schema.ts](../lib/marketing/site-content-schema.ts)
  - المالك: **Super Admin (Content/SEO studio)**

- **Pricing plans + comparison rows**
  - المصدر: [lib/marketing/pricing.ts](../lib/marketing/pricing.ts) + schema: [lib/marketing/commercial-schemas.ts](../lib/marketing/commercial-schemas.ts)
  - المالك: **Super Admin** (مع fallbacks ثابتة في الكود لحماية الصفحات إذا تعطلت البيانات)

- **Feature Catalog + Claims Registry + Feature Suites + Personas + Integrations showcase**
  - المصدر: [lib/marketing/commercial-registry.ts](../lib/marketing/commercial-registry.ts)
  - المالك: **Engineering** (حالياً) مع Guardrails tests لمنع drift

### 10.2 أسطح Claims القياسية (من الـ registry)

الأسطح التالية لها enum رسمي داخل `commercialClaimSurfaceSchema` وتُدار كنصوص claims من الـ registry (حالياً):

- `home.hero`
- `home.feature-grid`
- `home.trust-items`
- `home.proof-pills`
- `home.proof-strip`
- `home.integrations`
- `home.personas`
- `pricing.plan-card`
- `pricing.comparison`
- `plans.summary`
- `features.hero`
- `features.platform-anatomy`
- `features.platform-highlights`
- `features.suite`
- `careers.differentiator`
- `request-demo.sidebar`

## 11. ما هو editable من السوبر أدمن وما يظل هندسياً

### 11.1 Editable (Super Admin)

- محتوى الصفحات العامة البنيوي (site-content): badge/title/description/CTA/SEO الأساسي ضمن schema ثابت.
- إدارة الباقات والأسعار: الاسم، الأسعار، العملة، سعة الموظفين، الترتيب، popular/active، وقوائم features النصية.
- إدارة صفوف مقارنة الميزات: نص الصف + أعلام Starter/Business/Enterprise + الترتيب + active.

### 11.2 Engineering-only (حتى إشعار آخر)

- `Feature Catalog`:
  - `feature.id`, `family`, `status`, `commercialTier`, `availability`, `owner`, `evidencePaths`
- `Claims Registry`:
  - `claim.id`, `surface`, `slot`, `linkedFeatureIds`, `visibility`, `statusGate`, `strength`
- `Integrations showcase`:
  - `availability` و`linkedFeatureIds` (لتجنب وعود integrations غير دقيقة)

> ملاحظة: يمكن فتح تحرير claims لاحقاً في السوبر أدمن **فقط** بعد وجود workflow واضح (draft/preview/audit log) ومع الحفاظ على linkages (`linkedFeatureIds`) وgates ضمن قيود schema صارمة.

## 12. Commercial Review Gate (قبل أي تعديل تسويقي)

هذه checklist تشغيلية مختصرة قبل دمج أي تعديل يغيّر معنى الوعود التجارية أو الباقات:

1. **حدد الطبقة الصحيحة للتعديل**:
   - Site content؟ (عناوين/CTA/SEO) ⟵ عدّل عبر مصدر site-content.
   - Pricing plans/comparison؟ ⟵ عدّل عبر السوبر أدمن أو fallbacks.
   - Claim/Feature positioning؟ ⟵ عدّل عبر `commercial-registry`.
2. **لا تضف claims جديدة داخل صفحات `app/(guest)` مباشرة**.
3. **Public claims** يجب أن تكون:
   - `visibility: public`
   - `statusGate: live-only`
   - وكل `linkedFeatureIds` لها `status: live`
4. **Evidence paths** لكل Feature يجب أن تشير لمسارات موجودة فعلاً.
   - يتم التحقق تلقائياً عبر اختبار: [lib/marketing/commercial-registry-content.test.ts](../lib/marketing/commercial-registry-content.test.ts)
5. **حدّث master sheet** بعد أي تعديل على الكاتالوج:
   - `pnpm exec tsx scripts/export-feature-inventory.ts`
6. **شغّل quality gates** قبل الدمج:
   - `pnpm typecheck`
   - `pnpm test`
