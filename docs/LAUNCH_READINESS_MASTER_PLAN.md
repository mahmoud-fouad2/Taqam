# الخطة الرئيسية للجاهزية والانطلاق الاحترافي

> **المنتج:** طاقم (Taqam)
> **تاريخ التحديث:** 2026-04-13
> **الحالة:** الخطة المرجعية الرسمية للمرحلة القادمة
> **الهدف:** الخروج من عنق الزجاجة الحالي والانتقال من منتج واسع لكنه غير منضبط بالكامل إلى منتج احترافي، صادق تسويقياً، قابل للبيع، قابل للتطوير، وقابل للصيانة.

## آخر تنفيذ فعلي

- [x] تعطيل `self-service registration` الذي كان ينشئ tenant وحساب admin مفعّلين مباشرة من `register`.
- [x] تحويل صفحة `register` إلى مسار توجيه واضح نحو `sales-assisted activation` بدلاً من فتح إنشاء حساب production مباشرة.
- [x] توحيد مصدر بيانات `pricing` و`plans` في helper مشترك واحد بدل استمرار الصفحتين على تعريفات منفصلة.
- [x] إضافة واجهة فعلية في السوبر أدمن لإدارة صفوف مقارنة الميزات بجانب بطاقات الباقات.
- [x] تمرير الباقة المختارة من صفحات الباقات إلى `TenantRequest` وعرضها داخل inbox/details الخاصة بالسوبر أدمن.
- [x] ربط الطلب الموافق عليه بالانتقال المباشر إلى الشركة المنشأة عند توفر `tenantId`.
- [x] إدخال محتوى صفحة `request-demo` ضمن `Content and SEO studio` وتوحيد نصوصها وmetadata تحت مصدر محتوى مركزي واحد.
- [x] إضافة validation لواجهة `site-content` حتى تبقى تعديلات السوبر أدمن محكومة بـ schema واضحة بدلاً من الحفظ الخام.
- [x] جعل كل مسارات إنشاء الشركة (`tenant request approval` و`super-admin create tenant` والمسار القديم `/api/tenants`) تنشئ الشركة بحالة `PENDING` بدلاً من `ACTIVE` حتى لا تفتح workspace production قبل اكتمال التفعيل.
- [x] ربط اكتمال تفعيل مدير الشركة بتحويل الـ tenant من `PENDING` إلى `ACTIVE` تلقائياً، مع مواءمة التفعيل اليدوي من السوبر أدمن وواجهة إعدادات الشركة مع هذا السلوك.
- [x] توحيد mapping لحالة طلبات الشركات في السوبر أدمن بحيث تظهر مرحلة التفعيل الفعلية (`lead` / `pending-activation` / `activating` / `active`) من snapshots الطلب والـ tenant بدلاً من الاكتفاء بحالة الطلب الخام.
- [x] ضمان provisioning idempotent لأول `Employee` وربط `TENANT_ADMIN` بمساحة العمل في مسارات `reset-password` و`manual activation` و`bootstrap admin` و`user creation`.
- [x] منع تكرار `TenantRequest` المفتوح لنفس بريد التواصل، مع الاحتفاظ ببيانات التواصل داخل `tenant.settings` عند الموافقة حتى لا تضيع لاحقاً في خرائط الإدارة.
- [x] إصلاح redirect تسجيل الدخول بين `taqam.net` و`*.taqam.net` عبر مشاركة session cookies على مستوى الدومين الأساسي ومنع توليد روابط من نوع `demo.demo.taqam.net` عند إعادة التوجيه من subdomain موجود بالفعل.
- [x] تنفيذ audit فعلي لسطح claims التجاري الحالي وتوثيق الشكل المقترح للـ `Feature Catalog` و`Claims Registry` في `docs/COMMERCIAL_CLAIMS_AUDIT_AND_CATALOG_SHAPE.md` تمهيداً للترحيل المنضبط.
- [x] إضافة contract أولي داخل `lib/marketing/commercial-registry.ts` لتعريف shape الـ `Feature Catalog` والـ `Claims Registry` مع seed أولي للرسائل الأساسية المعتمدة.
- [x] بدء استهلاك الـ `Claims Registry` فعلياً في الصفحة الرئيسية عبر نقل `home feature grid` إلى المصدر التجاري الموحد وربط بطاقات الباقات في الصفحة الرئيسية بمصدر `pricing` المشترك بدل النسخ hardcoded.
- [x] توحيد `homepage integrations` في مصدر تسويقي مركزي مع فصل واضح بين ما هو `live` فعلاً (`GOSI/WPS`) وما يُعرض كتوصيل `enterprise custom` عند الطلب، مع إزالة claims العامة غير المثبتة من homepage وnav وbadge الصفحة الرئيسية.
- [x] ترحيل `homepage trust/proof surfaces` في الصفحة الرئيسية إلى `Claims Registry` عبر نقل `trust items` و`proof pills` و`proof strip` من arrays محلية إلى surfaces تجارية موحدة مرتبطة بقدرات فعلية.
- [x] توحيد `homepage personas` عبر نقل النصوص التجارية والـ role framing والـ benefit bullets إلى مصدر تسويقي مركزي، مع الإبقاء على الصور والسطوح البصرية page-local لأنها presentation layer لا claim source.
- [x] سحب framing المحلي المتبقي في `pricing/plans` إلى مصدر مشترك داخل `lib/marketing/pricing.ts` يشمل hero labels وsection copy وoptional add-ons وCTA copy وplan taglines بدل تكرارها داخل الصفحتين.
- [x] بدء تفكيك `features page` إلى surfaces تجارية registry-backed عبر نقل `features hero` وكتلة `platform anatomy` وبطاقات `platform highlights` إلى `Claims Registry`.
- [x] ترحيل `features suite catalog` بالكامل من hardcoded arrays إلى `Feature Suites registry` داخل `lib/marketing/commercial-registry.ts` بدون تغيير UX، مع ربط كل عنصر بـ feature ids وإضافة guardrail tests لمنع drift.
- [x] ترحيل differentiator cards في صفحة `careers` إلى `Claims Registry` وربطها بقدرات التوظيف الحقيقية (careers portal + applicants)، مع guardrail test لضمان وجود الـ slots.
- [x] إنشاء وتوليد `Feature Inventory master sheet` تلقائياً داخل `docs/FEATURE_INVENTORY.md` من `commercial-registry` لتوثيق status/evidence بدون drift.
- [x] توثيق taxonomy موحدة لحالات الـ features وgating/visibility للـ claims داخل `docs/COMMERCIAL_TAXONOMY.md`.
- [x] إضافة `claims registry content validation tests` (Vitest) لضمان اتساق النصوص وربط كل claim بميزات موجودة وحالتها صحيحة.
- [x] ترحيل `homepage testimonials` إلى مصدر تجاري مركزي مع `linkedFeatureIds` واختبار Guardrail يمنع social proof غير مربوط بقدرات live.
- [x] ترحيل محتوى صفحة `FAQ` إلى مصدر تسويقي مركزي (`lib/marketing/faq.ts`) وإزالة claim استيراد أرصدة الإجازات غير المثبتة.
- [x] تعديل claim `Excel Import & Export` في صفحة `features` ليقتصر على استيراد بيانات الموظفين فقط (بدون الإجازات) لعدم وجود import للإجازات حالياً.
- [x] تصنيف الـ 18 ميزة في Feature Catalog بدقة: 14 ميزة `live` و4 ميزات `beta` (performance.employee-evaluations, performance.development-plans, learning.training-academy, analytics.reports-and-exports) بناءً على evidence فعلي.
- [x] تصحيح `statusGate` في feature suite items المرتبطة بالـ beta features إلى `allow-beta` لمنع drift في guardrail tests.
- [x] تصحيح business plan bullet: إزالة "تقييم الأداء" (beta) والإبقاء على "بوابة التوظيف وإدارة المتقدمين" (live).
- [x] التحقق من integrations logos: الثلاثة موجودة على disk وموثقة بشكل صحيح في registry (GOSI/WPS: live, Mudad: enterprise-custom).
- [x] إعادة توليد `docs/FEATURE_INVENTORY.md` — 18 ميزة، 14 live, 4 beta.
- [ ] ما يزال Feature Catalog التجاري الأشمل وClaims Registry الموحدان بحاجة إلى استكمال في المراحل التالية.

---

## 1. القرار الرسمي

### 1.1 نموذج الدخول إلى المنتج

**القرار المعتمد:**

- طاقم سيكون **sales-assisted activation**.
- نقطة الدخول الأساسية للعملاء الجدد: `طلب اشتراك` أو `حجز جلسة تعريف`.
- لا يجوز أن يستمر التسجيل العام في إنشاء Tenant فعلي وحساب `TENANT_ADMIN` وبيئة مفعّلة مباشرة بدون ضوابط تشغيلية وتجارية.

### 1.2 معنى القرار عملياً

- التسجيل العام المفتوح لا يظل هو مسار تفعيل الشركات في الإنتاج.
- إن احتجنا صفحة `register`، تتحول إلى أحد خيارين فقط:
  - **invite-only account creation** بعد موافقة الفريق.
  - **pre-activation signup** ينشئ lead أو workspace في حالة `PENDING` وليس شركة مفعلة بالكامل.
- بعد الموافقة أو التفعيل، يبدأ **Activation Flow محترم** داخل النظام.

### 1.3 الوعود الأساسية للمنتج

هذه هي الرسائل التجارية الأساسية التي سنبني عليها كل صفحة تسويقية وكل باقة:

1. **إدارة الموظفين والهيكل التنظيمي**
2. **الحضور والإجازات والخدمة الذاتية للموظف**
3. **الرواتب والامتثال السعودي (WPS / GOSI)**
4. **تجربة موظف قوية على الجوال**

أي شيء خارج هذه الأربع رسائل يعتبر:

- قدرات متقدمة داخل المنتج
- أو إضافات enterprise
- أو roadmap future

ولا يجوز أن ينافس الرسائل الأربع في العناوين الرئيسية.

### 1.4 الميزة التفاضلية الواضحة

هناك ميزة يجب أن تظهر بوضوح كعنوان مستقل ومفهوم، لأنها ليست شائعة بنفس القوة عند كثير من المنافسين:

- **بوابة التوظيف وبورتال الوظائف للشركة**

والمقصود بها:

- بوابة وظائف عامة يمكن نشرها للمرشحين
- بورتال وظائف خاص بالشركة أو الـ tenant
- تجربة تقديم منظمة تربط بين الوظائف، المتقدمين، والانتقال لاحقاً إلى onboarding

هذه الميزة:

- لا تلغي الرسائل الأربع الأساسية
- لكنها تظهر كـ **Differentiator واضح** في التسويق التجاري وفي الباقات المناسبة
- ويجب ضبطها تجارياً وتقنياً حتى لا تظل مجرد claim عام

---

## 2. الحقيقة الحالية باختصار

## 2.1 ما هو قوي فعلاً الآن

- منتج ويب كبير وفيه وحدات كثيرة جداً
- Multi-tenant architecture موجودة
- صفحة Analytics موجودة فعلياً وتحتسب مؤشرات حقيقية
- Payroll + WPS + GOSI عندها أساس تنفيذي حقيقي أفضل من باقي التكاملات
- يوجد أساس فعلي لبوابة التوظيف وبورتال الوظائف للشركات
- Mobile app موجود بالفعل وليس مجرد check-in فقط
- يوجد Notifications وApproval flows في أكثر من مسار

## 2.2 ما هو غير منضبط حالياً

- مسار التسجيل الحالي يناقض نموذج sales-assisted activation
- claims التسويقية أوسع من التنفيذ الحقيقي لبعض المناطق
- الباقات موزعة على أكثر من صفحة بصياغات مختلفة ومصدرها ليس واحداً
- Layer التكاملات ليست موحدة على شكل platform حقيقي
- الموبايل مفيد لكنه لم يصل إلى مستوى polish مناسب لانطباع سوق B2B سعودي قوي
- الأتمتة موجودة كحالات منفصلة، لا كمحرّك workflows موحد

## 2.3 أهم اختناق حالي

الاختناق ليس قلة المميزات فقط.

الاختناق الحقيقي هو:

- **غياب الانضباط بين المنتج، التسويق، البيع، والتفعيل**
- **وجود capabilities حقيقية بدون packaging واضح**
- **وجود claims وواجهات قبل وجود platform تشغيلية خلفها**

---

## 3. مبادئ التنفيذ الإلزامية

هذه المبادئ غير قابلة للتفاوض أثناء التنفيذ:

1. **لا claim قبل capability قابلة للتشغيل والاختبار.**
2. **مصدر واحد للحقيقة** لكل الباقات والميزات والوعود التسويقية.
3. **لا إعادة كتابة شاملة للموبايل الآن** طالما يمكن productize التطبيق الحالي بشكل احترافي.
4. **لا migrations تدميرية** إلا عند ضرورة قصوى وبعد خطة rollback واضحة.
5. **كل feature كبيرة تطلق عبر flag أو staged rollout** إذا أمكن.
6. **التكاملات تبنى كمنصة Integrations Platform** لا كملفات عشوائية لكل مزود.
7. **الأتمتة تبدأ بـ high-value workflows** وليس DSL ضخم من اليوم الأول.
8. **الويب والموبايل والباقات والتسويق** يجب أن يعتمدوا على نفس تعريفات القدرات والقيود.
9. **كل ما يمكن ضبطه تجارياً من السوبر أدمن يجب نقله من الكود إلى لوحة الإدارة** بضوابط واضحة وبدون كسر الاتساق.
10. **لا no-code بدون guardrails**: التعديل الإداري يجب أن يكون مبنياً على schema مع validation وpreview وaudit log.

---

## 4. ما الذي سنغيره تجارياً

## 4.1 إعادة تغليف المنتج حول 4 رسائل فقط

### الرسالة 1: Core HR

- ملفات الموظفين
- الأقسام
- المسميات الوظيفية
- الهيكل التنظيمي
- المستندات الأساسية

### الرسالة 2: Attendance & Leave

- الحضور والانصراف
- الورديات
- الإجازات والأرصدة
- الموافقات الأساسية
- الخدمة الذاتية للموظف

### الرسالة 3: Payroll & Saudi Compliance

- مسير الرواتب
- قسائم الرواتب
- WPS export
- GOSI settings + calculations + reports

### الرسالة 4: Employee Mobile Experience

- تسجيل الحضور من الجوال
- الطلبات والإجازات
- كشوف الراتب
- الإشعارات والموافقات
- الملف الشخصي والإعدادات

## 4.2 ما الذي لا يتصدر الواجهة التجارية

هذه العناصر لا تختفي من المنتج، لكنها لا تبقى headline أولى:

- التوظيف
- الأداء
- التطوير والتدريب
- التقارير المخصصة المتقدمة
- التكاملات الخاصة جداً

يتم عرضها كالتالي:

- داخل باقة Business أو Enterprise
- أو ضمن قسم “قدرات متقدمة”
- أو ضمن add-ons مستقبلية

## 4.3 ميزة تفاضلية واضحة: بوابة التوظيف وبورتال الوظائف للشركة

هذه الميزة لا ندفنها داخل سطر صغير تحت recruitment، بل تظهر كعنوان واضح لأنها قيمة بيع حقيقية:

- بوابة وظائف عامة للمرشحين
- صفحة وظائف مخصصة لكل شركة
- تجربة تقديم منظمة
- نقل المرشح من job posting إلى applicant funnel إلى onboarding

ويتم تقديمها كالتالي:

- عنوان واضح في صفحات التسويق المناسبة
- بند مميز داخل Business وما فوق إذا اجتاز gate الجودة
- مساحة مخصصة في الـ Enterprise للتخصيص والهوية والـ branded careers experience

---

## 5. استراتيجية الباقات الجديدة

## 5.1 قواعد تصميم الباقات

الباقات يجب أن تكون:

- مرتبة من الأقل إلى الأعلى منطقياً
- مبنية على احتياج تشغيلي واضح
- قابلة للبيع بدون شرح طويل
- صادقة مع الواقع التقني
- قابلة للتوسع بدون إعادة هيكلة كل شهر

## 5.2 التوزيع التجاري المعتمد

### Starter

- للشركات الصغيرة التي تريد تشغيل HR وAttendance بسرعة
- لا نحمّلها claims معقدة عن integrations خاصة أو enterprise-grade automation

### Business

- هي الباقة الأساسية القابلة للبيع فعلياً لمعظم العملاء
- يجب أن تكون أقوى نقطة value في المنتج

### Enterprise

- ليست مجرد “كل شيء + سعر خاص”
- بل طبقة تشغيل، تكامل، دعم، وتخصيص حقيقي

## 5.3 النسخة التشغيلية المقترحة للباقات

### Starter — 499 SAR / شهر

**الفئة:** 5 إلى 10 موظفين

**يجب أن تحتوي فقط على ما نستطيع ضمانه فوراً:**

- إدارة الموظفين والهيكل التنظيمي
- الحضور والانصراف والورديات الأساسية
- إدارة الإجازات والأرصدة
- تطبيق الموظف للجوال
- التقارير الأساسية
- واجهة عربية / إنجليزية كاملة
- Activation guided setup

### Business — 999 SAR / شهر

**الفئة:** 10 إلى 25 موظفاً

**تضيف على Starter:**

- مسير الرواتب الشهرية
- قسائم الرواتب
- تصدير WPS
- إعدادات واحتساب GOSI
- الموافقات المتقدمة متعددة الخطوات
- Audit logs
- Analytics التشغيلية
- بوابة التوظيف وبورتال الوظائف للشركة إذا اجتازا gate الجودة
- التوظيف والأداء فقط إذا اجتازا gate الجودة

### Enterprise — تواصل معنا

**الفئة:** 25 إلى 100+ موظف

**تضيف على Business:**

- Integration-ready layer
- تكاملات مخصصة أو managed integrations
- API access مضبوط بالعقد
- مدير حساب + SLA
- تقارير مخصصة
- تخصيص بورتال الوظائف وهوية صفحة التوظيف للشركة
- تهيئة وتشغيل خاص
- سياسات وأتمتة مخصصة

## 5.4 قاعدة حاكمة للباقات

أي ميزة تظهر في:

- الصفحة الرئيسية
- صفحة الأسعار
- صفحة الخطط
- FAQ
- request-demo copy

يجب أن تسحب من **Feature Catalog واحد** لا من نصوص مكررة.

## 5.5 Feature Gate للباقات

قبل تثبيت أي ميزة داخل باقة يجب أن تمر على هذا gate:

- هل يوجد backend يعمل فعلاً؟
- هل يوجد UI usable؟
- هل يوجد auth/permissions صحيح؟
- هل يوجد happy path tested؟
- هل نعرف حدودها الحالية؟
- هل الدعم الفني قادر يشرحها ويشغلها؟

إذا فشل أي بند من الخمسة أعلاه:

- إما نحذف الميزة من الباقة حالياً
- أو ننقلها إلى “قريباً”
- أو نضعها enterprise custom فقط

## 5.6 لوحة السوبر أدمن كطبقة تحكم تجاري no-code

الهدف ليس أن نظل نعدل الأسعار والباقات والمحتوى التجاري من الكود كل مرة.

الهدف المعتمد:

- **السوبر أدمن يصبح Commercial Control Plane قدر الإمكان**

وهذا يشمل على الأقل:

- إدارة الباقات والأسعار
- إدارة ترتيب الباقات
- إدارة مقارنة الميزات بين الباقات
- إدارة Feature Catalog التجاري
- إدارة labels وbadges مثل “الأكثر طلبًا”
- إدارة status كل feature: live / partial / planned / enterprise custom
- إدارة status التكاملات تجارياً
- إدارة إظهار أو إخفاء claims محددة
- إدارة CTA النصية الأساسية للباقات والصفحات التجارية
- إدارة تمييز بوابة الوظائف كميزة تفاضلية عندما تكون جاهزة

## 5.7 Guardrails للـ no-code داخل السوبر أدمن

نحن لا نريد لوحة no-code فوضوية تكسر الاتساق.

لذلك يجب أن تحتوي على:

- schema واضحة للبيانات التجارية
- validation قبل الحفظ
- preview قبل النشر
- draft / publish model عند الحاجة
- audit log لكل تعديل
- revert أو version history للعناصر المهمة
- منع إدخال claims خارج taxonomy المعتمدة
- ربط مباشر بين الخطة التجارية والـ Feature Catalog

---

## 6. المسارات التنفيذية الرئيسية

لدينا 7 مسارات عمل مترابطة:

1. **Activation & Tenant Lifecycle**
2. **Claims Cleanup & Commercial Truth**
3. **Commercial Packaging, Feature Catalog & No-Code Super Admin Control**
4. **Integrations Platform**
5. **Mobile Productization**
6. **Automation Engine**
7. **Architecture, Quality, and Launch Hardening**

---

## 7. المرحلة صفر: Product Truth & Control Gate

> **الهدف:** وقف التناقض بين ما نبيعه وما نشغله.

### المخرجات المطلوبة

- تثبيت القرار الرسمي: sales-assisted activation
- تجميد claims غير المثبتة
- توحيد تعريف الباقات والميزات
- تحديد ما هو live / beta / planned / enterprise-custom

### المهام

- [x] مراجعة كل نقاط الدخول العامة: home, pricing, plans, faq, request-demo, features
  - [x] home
  - [x] pricing
  - [x] plans
  - [x] request-demo
  - [x] faq
  - [x] features
- [x] بناء جدول تدقيق feature inventory (`docs/FEATURE_INVENTORY.md`)
- [x] تصنيف كل ميزة إلى:
  - [x] Live (14 ميزة)
  - [x] Beta — يُعرض في مسارات advanced/business/enterprise لكن بدون live-only claim (4 ميزات: performance evaluations, development plans, training academy, reports & exports)
  - [ ] Partial — لا يوجد حالياً
  - [ ] Planned — لا يوجد حالياً
  - [ ] Enterprise custom — مُعالج عبر `availability: "enterprise-custom"` في Integration Showcase
- [x] إيقاف أو إخفاء أي claim غير صادق (تم: إزالة performance evaluations من business plan bullet, تصحيح evidence paths)
- [x] اتخاذ قرار واضح حول route `register`
- [x] منع public tenant auto-provisioning من الإنتاج
- [x] إنشاء مصدر موحد لتعريف الباقات والميزات
- [x] تثبيت عنوان “بوابة التوظيف وبورتال الوظائف للشركة” كميزة تفاضلية مع status تجاري صحيح
- [x] حصر كل الأسطح التجارية التي يجب نقلها إلى السوبر أدمن بدلاً من الكود (`docs/COMMERCIAL_CLAIMS_AUDIT_AND_CATALOG_SHAPE.md`)
- [x] تعريف taxonomy موحدة للـ claims والـ feature statuses (`docs/COMMERCIAL_TAXONOMY.md`)
- [x] تعريف commercial review gate قبل أي تعديل صفحة تسويقية (`docs/COMMERCIAL_CLAIMS_AUDIT_AND_CATALOG_SHAPE.md`)
- [x] توثيق ما هو editable من السوبر أدمن وما يظل هندسياً فقط (`docs/COMMERCIAL_CLAIMS_AUDIT_AND_CATALOG_SHAPE.md`)

### معايير الإنجاز

- لا يوجد نص تسويقي يسبق التنفيذ الحقيقي
- لا توجد باقة مختلفة المعنى بين `pricing` و`plans`
- لا يوجد route عامة تنشئ tenant production-ready بدون gate

### تنبيه مهم

لا نبدأ بناء integrations أو automation أو تحسينات mobile قبل إنهاء هذه المرحلة، لأننا إن فعلنا سنضيف طبقات فوق أساس تجاري غير منضبط.

---

## 8. المرحلة الأولى: Activation Flow محترم بعد إنشاء الشركة

> **الهدف:** تحويل onboarding من عملية خام أو يدوية بالكامل إلى تجربة تفعيل احترافية قابلة للقياس.

## 8.1 النتيجة المطلوبة

بدلاً من:

- إنشاء tenant مباشر غير منضبط
- أو اعتماد يدوي غير منظم

نريد:

- Lead أو tenant pending
- موافقة أو تفعيل
- Wizard واضح متعدد الخطوات
- حفظ حالة التقدم
- demo/sample data اختياري
- جاهزية أولية حقيقية لاستخدام النظام

## 8.2 النموذج المستهدف

### Tenant lifecycle

- `LEAD`
- `PENDING_REVIEW`
- `APPROVED`
- `ACTIVATING`
- `ACTIVE`
- `SUSPENDED`
- `ARCHIVED`

### Activation flow steps

1. **بيانات الشركة الأساسية**
   - اسم الشركة
   - اسم الشركة بالإنجليزية
   - النشاط
   - عدد الموظفين
   - الدولة / المدينة
   - المجال

2. **الإعدادات العامة**
   - اللغة الافتراضية
   - المنطقة الزمنية
   - العملة
   - بداية الأسبوع
   - تنسيق التاريخ

3. **الهيكل الأساسي**
   - أول قسم
   - أول مسمى وظيفي
   - أول مدير أو مسؤول HR

4. **أول موظف / أول Admin موظف**
   - إنشاء أول employee record صحيح
   - ربطه بالمستخدم الإداري عند الحاجة

5. **السياسات الأساسية**
   - leave types الأساسية
   - approval defaults
   - attendance defaults
   - payroll defaults

6. **تهيئة الجوال والخدمة الذاتية**
   - تفعيل mobile usage policy
   - إعدادات biometrics/location policy إن وجدت

7. **البيانات التجريبية**
   - خيار sample data on/off
   - لا تفرض تلقائياً على الجميع

8. **التحقق النهائي**
   - readiness checklist
   - next actions
   - دعوة باقي الفريق

## 8.3 البناء التقني المطلوب

- [x] جدول أو JSON state خاص بـ activation progress — `setupStep`, `setupCompletedAt`, `setupData` أضيفت لـ Tenant model
- [x] service واحدة لإدارة activation state — `lib/setup.ts`
- [x] autosave لكل خطوة — كل POST `/api/setup` يحفظ بيانات الخطوة
- [x] resume later — `getSetupStatus()` تقرأ الـ `setupStep` المحفوظة عند إعادة الفتح
- [x] validation على مستوى الخطوة وعلى مستوى الرحلة كاملة — Zod schemas per step
- [x] seeders للـ default policies — `provisionSetupDefaults()` في `lib/setup.ts` تُنشئ leave types افتراضية عند اكتمال الإعداد
- [x] sample data seeding منفصل وقابل للحذف لاحقاً
- [x] audit log لكل خطوة حرجة
- [x] ربط activation flow بحالة الـ tenant lifecycle — `setupCompletedAt` تُكمل الدورة
- [x] ربط activation flow بالسوبر أدمن للمراجعة أو المساعدة اليدوية — بطاقة "حالة التفعيل" في صفحة tenant detail مع setupStep وsetupCompletedAt ورابط wizard
- [x] تفعيل readiness score أو completion percent — `getSetupCompletionPercent()`
- [x] provisioning idempotent لأول employee/admin workspace profile عند اكتمال setup أو تفعيل مدير الشركة
- [x] mapping مشتق لحالة activation داخل inbox/details الخاصة بطلبات الشركات بدل الاكتفاء بـ request status الخام
- [x] event tracking لكل خطوة رئيسية في رحلة التفعيل

## 8.4 UX المطلوب

- [x] progress bar واضحة — `Progress` component + completionPercent في الـ wizard
- [x] estimated time — عرض "~N دقيقة" لكل خطوة + "متبقي X دقيقة" في شريط التقدم
- [x] شرح بسيط لكل خطوة — paragraph text تحت عنوان كل step
- [x] CTA واحد فقط في كل شاشة — "التالي" / "إتمام الإعداد"
- [x] لا نظهر settings متقدمة مبكراً — الـ wizard مبسط (5 خطوات عملية فقط)
- [x] empty states عملية — شاشة اكتمال مع 3 بطاقات خطوات تالية + ملخص ما تم إعداده
- [x] exit and continue later — resume later يعمل عبر `setupStep` المحفوظة في DB

## 8.5 معايير الإنجاز

- [x] شركة جديدة يمكن تفعيلها بدون تدخل هندسي مباشر — wizard 5 خطوات + API routes كاملة
- [x] أول استخدام للوحة لا يكون فارغاً أو مربكاً — شاشة اكتمال + Getting Started widget في dashboard
- [x] العميل يعرف ما الذي فعله وما الذي تبقى — completion screen يعرض ملخص + next steps
- [x] أول مدير شركة لا يبقى user معزولاً عن HR workspace — الربط مع employee record يتم تلقائياً عند التفعيل أو الاستعادة

---

## 9. المرحلة الثانية: تنظيف claims التسويقية وتوحيد الحقيقة التجارية

> **الهدف:** كل claim تسويقي يصبح إما صحيحاً، أو محذوفاً، أو مصنفاً بوضوح.

## 9.1 المناطق المطلوب مراجعتها

- [x] الصفحة الرئيسية
- [x] صفحة المميزات (الـ hero/anatomy/highlights وfeature suites كلها أصبحت registry-backed عبر `getMarketingFeatureSuites()`)
- [x] صفحة الأسعار
- [x] صفحة الخطط
- [x] FAQ
- [x] request-demo copy
- [x] hero stats (computed من data حقيقية — plans.length, faqCategories.length، الخ)
- [x] testimonials
- [x] integrations logos (GOSI/WPS: live, Mudad: enterprise-custom — كلهم موجودون على disk)
- [x] feature bullets في كل باقة (تم: إزالة performance evaluations من business plan، استبدالها ببوابة التوظيف)

## 9.2 التصنيف المعتمد لكل claim

- **Live**: تعمل الآن end-to-end
- **Configured**: framework موجود لكن تحتاج إعداد عميل أو credential فقط
- **Enterprise custom**: ليست جاهزة عامة، لكنها ممكنة كمشروع مخصص
- **Planned**: غير موجودة حالياً، ولا تذكر كأنها متاحة

## 9.3 أمثلة عملية يجب ضبطها

- Muqeem وMudad وSAP وERP لا تُعرض كـ integrations live إلا إذا أصبح عندها:
  - [ ] connection test
  - [ ] credential storage
  - [ ] sync health
  - [ ] logs
  - [ ] run history

- الموبايل لا يوصف بأنه “full employee super app” إلا بعد polishing والاختبارات الرئيسية.

- automation لا توصف بأنها engine كاملة قبل وجود triggers + runs + logs + retry.

## 9.4 البناء المطلوب لمنع تكرار المشكلة

- [x] Feature catalog موحد — `lib/marketing/commercial-registry.ts` (FeatureSuitesRegistry + ClaimsRegistry)
- [x] Pricing source of truth موحد — `lib/marketing/pricing.ts` + `PricingPlan` DB model
- [x] Integration catalog موحد — `lib/integrations/catalog.ts` (9 providers)
- [x] helper أو config موحد للصفحات العامة — `getText()` + `lib/marketing/pricing.ts` helpers
- [x] Claims registry موحد وقابل للإدارة — `CommercialRegistry` في `commercial-registry.ts`
- [x] ربط النصوص التجارية القابلة للتعديل بلوحة السوبر أدمن — pricing + feature-comparison + site-content managers
- [x] preview للنصوص قبل النشر من السوبر أدمن
- [x] draft/publish workflow للمحتوى التجاري المهم

### البيانات المقترحة في Feature Catalog

- `key`
- `nameAr`
- `nameEn`
- `status`
- `tierAvailability`
- `commercialLabel`
- `visibility`
- `notes`

## 9.5 معايير الإنجاز

- لا يوجد claim متناقض بين صفحتين
- الباقات لا تتغير في معناها من صفحة لأخرى
- كل integration مذكورة لها status تجاري واضح

---

## 10. المرحلة الثالثة: Integrations Platform حقيقية

> **الهدف:** تجهيز طبقة تكاملات تعمل فعلياً الآن لمن نستطيع، وتكون جاهزة ومحترفة للباقي حتى لو كان التنفيذ المستقبلي عبر API أو embedded أو manual bridge.

## 10.1 قرار استراتيجي

لن نبني التكاملات كالتالي:

- ملف لكل مزود
- حالة مشتتة
- credentials في settings فقط
- لا history ولا health ولا retries

بل سنبني **Integrations Platform** فيها providers موحدة.

## 10.2 أوضاع التكامل المسموح بها

كل مزود يمكن أن يعمل بأحد 4 أوضاع:

1. **Native API**
2. **Embedded / Deep-link / Hosted flow**
3. **Managed import/export bridge**
4. **Enterprise custom connector**

بهذا نقدر “نجهز” التكاملات مبكراً حتى لو الشراكة النهائية لم تتم بعد.

## 10.3 الأولويات

### أولوية A

- GOSI
- WPS
- Mudad
- Muqeem
- MOL إن كان جزءاً من الحاجة المحلية

### أولوية B

- ERP generic layer
- SAP
- Oracle
- Odoo

### أولوية C

- Google Workspace
- Microsoft 365
- Slack
- Teams

## 10.4 المكونات التقنية المطلوبة

### IntegrationConnection

- [x] provider key
- [x] display name
- [x] mode: native / embedded / manual / custom
- [x] status: disconnected / pending / connected / degraded / error
- [x] credentialsEncrypted
- [x] config JSON
- [ ] scopes / permissions summary
- [x] lastConnectedAt
- [x] lastHealthCheckAt
- [x] lastSyncAt
- [x] lastError

> **تم:** `prisma/schema.prisma` → model `IntegrationConnection` + `pnpm exec prisma generate` ✓

### IntegrationJob (IntegrationRun)

- [x] job type (operation)
- [x] provider (via connection FK)
- [x] tenantId (via connection FK)
- [ ] payload
- [x] scheduledAt (startedAt)
- [x] startedAt
- [x] finishedAt
- [x] status
- [x] retryCount
- [x] durationMs

> **تم:** `prisma/schema.prisma` → model `IntegrationRun` ✓

### IntegrationRunLog

- [x] run id
- [x] connection id
- [x] operation
- [x] result summary
- [x] errors
- [x] duration

> **تم:** مدمجة في `IntegrationRun` ✓

### IntegrationProvider contract

- [x] catalog definition (key, name, description, mode, availability)
- [x] validateCredentials()
- [x] testConnection()
- [ ] pull()
- [ ] push()
- [ ] healthCheck()
- [ ] normalizeError()

> **تم:** `lib/integrations/catalog.ts` — 9 providers (GOSI, WPS, Mudad, Muqeem, MOL, SAP, Oracle, Google Workspace, Microsoft 365) ✓

## 10.5 واجهة الإدارة المطلوبة

- [x] integrations catalog screen — `app/dashboard/settings/integrations/`
- [x] connect/disconnect UI — `integrations-showcase.tsx`
- [x] test connection button
- [x] sync now button
- [x] status badge
- [x] last sync state
- [x] run history table
- [x] retry failed run
- [x] masked credential display
- [x] provider mode selector: native / embedded / manual / custom
- [x] embedded launch URL or managed-setup hint
- [x] health summary widget داخل السوبر أدمن أو إعدادات الشركة

> **API:** `GET/POST /api/integrations` + `GET/PATCH/DELETE /api/integrations/[key]` ✓

## 10.6 المخرجات السريعة المقبولة

حتى قبل اكتمال التكاملات live، يمكن إطلاق التالي:

- [x] integration placeholders مهنية — availability badges (live/enterprise-custom/coming-soon)
- [x] credential capture
- [x] connection validation structure — schema + upsert API ✓
- [x] "coming via managed setup" status — availability: "enterprise-custom" ✓
- [x] embedded links أو hosted launch mode — EMBEDDED mode type ✓
- [x] manual CSV bridge where applicable

## 10.7 معايير الإنجاز

- أي تكامل مذكور في الباقات له representation حقيقية في النظام
- نعرف حالته، آخر sync، آخر خطأ، وهل هو usable أم لا
- لا تبقى كلمة “تكامل” مجرد نص في صفحة تسويقية

---

## 11. المرحلة الرابعة: Mobile Productization

> **الهدف:** تحويل التطبيق من MVP مفيد إلى تجربة موظف ممتازة ومقنعة بصرياً وتشغيلياً.

## 11.1 القرار التقني

**لا نعيد كتابة التطبيق بـ Flutter الآن.**

القرار الحالي:

- نكمل على `apps/mobile`
- نرفع الجودة التصميمية والتشغيلية
- نوحّد Design Language بين web وmobile
- نؤجل rewrite فقط إذا ظهر سبب تقني حقيقي لا مجرد انطباع

## 11.2 المسارات التي يجب أن تصبح ممتازة

### Employee Daily Core

- [ ] Home / Dashboard
- [ ] Attendance
- [ ] Leaves & Requests
- [ ] Payslips
- [ ] Notifications
- [ ] Approvals
- [ ] Profile
- [ ] Settings

### Foundational UX

- [ ] loading states محترمة
- [ ] error states واضحة
- [ ] empty states غير محرجة
- [ ] typography عربية قوية
- [ ] motion بسيطة لكن محسوبة
- [ ] RTL حقيقي ومتسق
- [ ] visual hierarchy ممتازة
- [ ] touch targets سليمة

## 11.3 ماذا نحتاج عملياً

- [ ] Mobile design tokens مشتركة مع الويب
- [ ] إعادة تصميم navigation
- [ ] تحسين cards والقوائم والfilters
- [ ] تحسين payslips readability
- [ ] تحسين leave request flow
- [ ] notifications UX أفضل
- [ ] approvals UX واضح للمدير
- [ ] better onboarding داخل app للموظف
- [ ] push registration + preferences + unread handling
- [ ] device/session diagnostics منظمة
- [ ] توحيد لغة التصميم مع الويب بدون تكرار تصميمي متضارب
- [ ] تحسين branded feel للتطبيق ليحمل انطباع منتج كامل لا MVP سريع

## 11.4 الجودة والإصدار

- [ ] release signing production-ready
- [ ] build reproducibility
- [ ] device matrix للاختبار
- [ ] Android QA على أجهزة منخفضة ومتوسطة
- [ ] network failure handling
- [ ] crash reporting واضح

## 11.5 معايير الإنجاز

- الموظف يستطيع تنفيذ أهم 5 مهام يومية بسلاسة من الجوال
- الانطباع البصري لا يبدو MVP خام
- التطبيق صالح للعرض التجاري الحقيقي وليس مجرد إثبات فكرة

---

## 12. المرحلة الخامسة: Automation Engine متكامل

> **الهدف:** بناء أتمتة حقيقية تدريجية، لا مجرد إشعارات متناثرة.

## 12.1 ما هو موجود الآن

- notifications على مسارات معينة
- approvals على بعض الطلبات
- إعدادات workflows كبيانات في بعض المناطق

## 12.2 ما هو المطلوب

نريد Engine يدعم:

- triggers
- conditions
- actions
- runs
- retry
- logs
- tenant isolation
- versioning

## 12.3 النموذج المقترح

### WorkflowDefinition

- [x] name
- [x] trigger type
- [x] enabled
- [x] version
- [x] scope
- [x] conditions JSON
- [x] actions JSON

### WorkflowRun

- [x] workflowId
- [x] trigger payload
- [x] status
- [x] startedAt
- [x] finishedAt
- [x] failure reason
- [x] retry count

### WorkflowActionLog

- [x] action type
- [x] result
- [x] output
- [x] error

## 12.4 أول 8 workflows يجب تنفيذها قبل أي توسع

- [x] إذا طلب إجازة -> إشعار + approval chain
- [x] إذا تمت الموافقة/الرفض -> إشعار الموظف
- [ ] إذا موظف غاب -> إشعار المدير
- [ ] إذا Document قرب الانتهاء -> تنبيه HR + الموظف
- [ ] إذا نهاية probation اقتربت -> إشعار المدير وHR
- [ ] إذا payroll period أغلقت -> إشعار الإدارة
- [x] إذا payslip أصبحت جاهزة -> إشعار الموظف
- [ ] إذا onboarding task delayed -> escalation

## 12.5 ما لن نفعله الآن

- [ ] لا DSL no-code معقدة من أول نسخة
- [ ] لا visual builder ضخم قبل ثبات model البيانات

## 12.6 نسخة MVP للـ Engine

النسخة الأولى تكفيها:

- trigger registry ثابت
- conditions بسيطة
- actions من نوع notification / assignment / status change / webhook call
- retries محدودة
- admin logs
- execution dashboard أساسي
- workflow toggles من السوبر أدمن أو من إعدادات الشركة حيث يناسب

## 12.7 معايير الإنجاز

- workflows لها runs واضحة
- failures يمكن فهمها وإعادة تشغيلها
- لا تصبح الأتمتة black box

---

## 13. المرحلة السادسة: Architecture & Maintainability Hardening

> **الهدف:** استكمال البناء بشكل احترافي وقابل للصيانة، وليس فقط إطلاق سريع.

## 13.1 المطلوب معمارياً

- [ ] فصل واضح بين marketing data وproduct capability data
- [x] adapter layer للتكاملات
- [x] service layer للـ activation — `lib/setup.ts`
- [x] service layer للـ automation
- [ ] منع تكرار business rules بين web/mobile/api
- [ ] typed contracts بين backend والواجهات
  - [x] shared contracts لتدفق integrations settings/test/sync/retry في `lib/integrations/contracts.ts`
- [x] فصل commercial control data عن static marketing code
- [ ] no-code admin contracts مع validation طبقية
- [ ] publish pipeline واضحة للمحتوى التجاري القابل للتعديل

## 13.2 الجودة والاختبارات

- [ ] unit tests للمنطق الحرج
  - [x] integration contracts normalization/parsing tests — `lib/integrations/contracts.test.ts`
- [ ] integration tests للمسارات الأساسية
  - [x] integration connection route tests لـ `GET` / `PATCH` / `DELETE` / `test` / `sync` / `retry` — `app/api/integrations/connection-routes.test.ts`
- [x] smoke tests للصفحات العامة
- [x] pricing/claims snapshot tests أو content validation tests
  - [x] pricing marketing content validation tests (Vitest)
  - [x] claims/content validation tests للصفحات العامة
- [ ] end-to-end للـ activation flow
- [ ] end-to-end للموبايل في أهم 5 مسارات

## 13.3 الرصد والتشخيص

- [x] structured logs للتكاملات
- [x] workflow logs
- [x] activation logs
- [x] mobile crash + error visibility
- [x] admin diagnostics for support

## 13.4 الضبط الأمني

- [ ] secrets مشفرة
- [ ] لا credential في client
- [ ] least privilege لكل integration
- [ ] rate limits للمسارات الحساسة
- [ ] audit log للعمليات الإدارية والتكاملية

---

## 14. خطة التنفيذ المرحلية المقترحة

## Phase A — أسبوع 1 إلى 2

**التركيز:** الحقيقة التجارية + إيقاف التناقضات

- [x] إيقاف public tenant activation غير المنضبط
- [ ] تدقيق claims
- [x] توحيد الباقات والميزات في source of truth واحد
- [ ] تصنيف كل integration تجارياً
- [ ] تثبيت الرسائل الأربع الأساسية
- [ ] تثبيت عنوان بوابة التوظيف وبورتال الوظائف كميزة تفاضلية
- [x] تدقيق pricing / plans / faq / home ضد الواقع الفعلي
- [ ] حصر العناصر التجارية التي يجب إدارتها من السوبر أدمن
- [ ] تعريف claim registry وfeature status taxonomy
- [ ] مراجعة نهائية مع منظور product + sales + support

## Phase B — أسبوع 3 إلى 5

**التركيز:** Activation flow + tenant lifecycle

- [x] statuses واضحة للـ tenant — `PENDING`, `ACTIVE`, `SUSPENDED`, `CANCELLED`
- [x] wizard متعدد الخطوات — `app/dashboard/setup/` (5 خطوات: ملف الشركة، ضبط العمل، الهيكل، أول موظف، السياسات)
- [x] default policies seeding — خطوة 5 تنشئ إجازة سنوية وإجازة مرضية تلقائياً
- [x] sample data option
- [x] progress tracking — `setupStep`, `completionPercent`, progress bar في الـ wizard
- [x] lead / pending / approved lifecycle wiring
- [x] step autosave + resume later — POST `/api/setup` يحفظ كل خطوة، initialStep يعيد من حيث توقف
- [x] first admin + first employee linking
- [x] readiness checklist داخل الflow
- [x] team invite step — خطوة 4 تتيح دعوة أول موظف أو تخطي

## Phase C — أسبوع 6 إلى 8

**التركيز:** Integrations platform foundation

- [ ] schema + provider contract
- [x] credentials store
- [x] connection tests
- [x] health states
- [x] jobs + retry + logs
- [x] واجهة الإدارة
- [x] provider mode support (API / embedded / manual / custom)
- [x] integration run history
- [x] manual bridge workflows
- [x] connection health summary and retry UX

## Phase D — أسبوع 9 إلى 11

**التركيز:** Mobile polish

- [ ] IA refinement
- [ ] screen redesign
- [ ] push and notification polish
- [ ] payslips / leave / approvals upgrades
- [ ] device QA
- [ ] attendance UX polish
- [ ] profile and settings polish
- [ ] Arabic typography and spacing pass
- [ ] loading / error / empty states pass
- [ ] release-signing and store-readiness pass

## Phase E — أسبوع 12 إلى 14

**التركيز:** Automation engine MVP

- [x] workflow schema
- [x] run engine
- [x] core triggers
- [x] logs + retry
- [x] admin control surface
- [x] condition evaluator MVP
- [x] action executor MVP
- [x] first leave workflow end-to-end
- [ ] first absence alert workflow end-to-end
- [x] workflow diagnostics and run history review

## Phase F — أسبوع 15 إلى 16

**التركيز:** launch hardening

- [ ] QA كامل
- [ ] content freeze
- [x] support playbook
- [x] go-live checklist
- [x] pricing truth validation
- [x] claims validation pass
- [ ] activation flow end-to-end validation
- [ ] mobile core journeys validation
- [ ] rollback / incident response rehearsal
- [ ] pilot tenant readiness review

---

## 15. Checklist الرئيسية الكاملة

## 15.1 Product Truth

- [x] القرار الرسمي موثق: sales-assisted activation
- [x] public register لم يعد يفعّل شركات مباشرة في الإنتاج
- [ ] كل صفحة تسويقية audited
- [ ] كل claim لها status واضح

## 15.2 Activation

- [x] tenant lifecycle model موجود
- [x] activation wizard موجود
- [x] autosave موجود
- [x] sample data اختياري
- [x] readiness checklist موجودة

## 15.3 Pricing & Packaging

- [x] source of truth واحد للباقات
- [x] pricing page متسقة مع plans page
- [x] FAQ متسقة مع pricing
- [ ] feature gate مطبق على كل عنصر باقة
- [x] بوابة التوظيف وبورتال الوظائف موضحة كميزة تفاضلية في المكان الصحيح

## 15.4 Super Admin No-Code Control

- [x] إدارة الباقات والأسعار من السوبر أدمن
- [x] إدارة comparison rows من السوبر أدمن
- [x] إدارة feature catalog التجاري من السوبر أدمن
- [x] إدارة badges وlabels وCTA الأساسية من السوبر أدمن
- [x] draft / publish أو preview مع validation
- [x] audit log للتعديلات التجارية

## 15.5 Integrations

- [x] connection model موجود
- [x] encrypted credentials
- [x] provider adapters
- [x] sync jobs
- [x] connection tests
- [x] health state
- [x] retry
- [x] logs
- [x] admin UI

## 15.6 Mobile

- [ ] attendance polished
- [ ] leaves polished
- [ ] payslips polished
- [ ] approvals polished
- [ ] notifications polished
- [ ] profile/settings polished
- [ ] release signing production-ready

## 15.7 Automation

- [x] workflow definitions
- [x] workflow runs
- [x] action logs
- [x] retry policy
- [ ] first 8 workflows live

## 15.8 Architecture & Quality

- [ ] typed contracts واضحة
- [ ] tests للمسارات الحرجة
- [ ] logs منظمة
- [ ] rollback plan لأي migration كبيرة
- [x] support diagnostics جاهزة

---

## 16. التحذيرات الأساسية

### لا نفعل الآتي

- لا نضيف claim تسويقي جديد قبل gate التشغيل
- لا نبدأ Flutter rewrite الآن
- لا نوزع تعريف الباقات في 5 ملفات بدون source of truth
- لا نبني تكاملات كإعدادات شكلية فقط
- لا نبني rules engine معقد قبل MVP workflows واضح
- لا نطلق Activation Flow بدون tracking state وحفظ تقدم

### إذا تجاهلنا هذه التحذيرات

سنعود لنفس الاختناق الحالي لكن بحجم أكبر:

- منتج أكبر
- تعقيد أعلى
- claims أكثر
- انضباط أقل

---

## 17. أولويات البدء الفوري

هذه هي أول 10 خطوات تنفيذية يجب أن تبدأ فوراً وبالترتيب:

1. [x] تعطيل أو إعادة تصميم public tenant auto-provisioning
2. [x] إنشاء feature inventory master sheet
3. [x] إنشاء source of truth للباقات والميزات
4. [x] تثبيت بوابة التوظيف وبورتال الوظائف كميزة تفاضلية واضحة في packaging
5. [ ] تصميم commercial control plane داخل السوبر أدمن
6. [ ] تنظيف home / pricing / plans / faq من claims غير الدقيقة
7. [ ] تصميم tenant lifecycle الرسمي
8. [ ] تصميم activation wizard information architecture
9. [ ] تصميم integration platform schema
10. [ ] تعريف launch exit criteria

---

## 18. تعريف النجاح

سنعتبر أنفسنا خرجنا من عنق الزجاجة عندما تصبح الصورة كالتالي:

- العميل يفهم المنتج خلال دقائق
- الباقات صادقة وواضحة وسهلة البيع
- التفعيل منظم وقابل للقياس
- التكاملات لها Layer حقيقية وليست مجرد claims
- تجربة الموظف على الجوال قوية ومقنعة
- الأتمتة تعمل عبر engine واضح وليس logic متناثر
- المشروع أسهل في الصيانة والتوسعة من وضعه الحالي

---

## 19. ملاحظات تنفيذية نهائية

- هذه الوثيقة هي المرجع الأعلى للمرحلة القادمة.
- لا يتم تنفيذ workstream جديد كبير خارج ترتيبها إلا بسبب واضح ومكتوب.
- عند إتمام أي بند رئيسي، يتم تحديث هذه الوثيقة مباشرة قبل الانتقال لما بعده.
- أي قرار يغير الباقات أو claims أو activation model يجب أن يُسجّل هنا أولاً.

---

## 20. قواعد العمل بالتودوز والتحديث المستمر

هذه القواعد إلزامية أثناء التنفيذ الفعلي للخطة:

1. كل Phase تنفيذية يجب أن تحتوي على **10 todos على الأقل** كما هو موضح في هذه الوثيقة.
2. قبل بدء أي batch عمل فعلي، يتم إنشاء Todo list تشغيلية من المرحلة الحالية.
3. لا نفتح أكثر من مسار رئيسي active في نفس اللحظة إلا لسبب واضح.
4. عند إنهاء أي todo رئيسية، يتم تحديث:
   - checklist داخل هذه الوثيقة
   - Todo list التشغيلية
   - أي ملاحظات قرار مرتبطة بها
5. أي بند blocked يجب أن يسجل معه:
   - سبب التعطل
   - المخاطر
   - القرار التالي
6. لا ننتقل إلى المرحلة التالية قبل مراجعة exit criteria للمرحلة الحالية.
7. أي تعديل تجاري من السوبر أدمن لا يعتبر منجزاً حتى يمر validation وpreview وaudit log.
8. أي claim جديدة لا تدخل الصفحات العامة قبل إضافتها إلى الـ Feature Catalog وحصولها على status صحيح.
9. أي milestone كبيرة تُغلق فقط بعد تحديث هذا الملف نفسه.
10. هذا الملف يبقى المرجع التشغيلي الأعلى، وأي todo جديدة تُضاف فيه أو في الـ working todo system لا خارجهما.
