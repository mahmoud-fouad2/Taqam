# وثيقة تدقيق منطق/تصميم النظام (Logical & UX Architecture Audit)

تاريخ: 2026-02-05

هذه الوثيقة تركّز على **الأخطاء المنطقية والفكرية** (وليست أخطاء برمجية فقط)، وتقدّم خطة إصلاح **قابلة للتنفيذ** خطوة بخطوة.

> نطاق الوثيقة: Next.js (App Router) + Prisma/Postgres + Multi-tenancy + Mobile JWT APIs + Capacitor wrapper + Render deployment.

---

## 1) ملخص تنفيذي (Executive Summary)

### المشكلة الأساسية (Root Problem)
النظام يخدم عدة “منتجات” مختلفة من نفس التطبيق:
- موقع تسويقي (Marketing) على `/`
- لوحة تحكم ويب (Dashboard) على `/dashboard`
- واجهة سوبر أدمن (Super Admin) على `/dashboard/super-admin`
- واجهة موبايل (Mobile) كانت تفتح الموقع التسويقي داخل WebView ثم تُجبر المستخدم على اختيار الشركة (Tenant)

هذا أدى إلى تجربة موبايل خاطئة: المستخدم يفتح التطبيق → يرى صفحة الموقع + “اختيار الشركة” بدل (Login → بصمة دخول/خروج).

### ما تم عمله بالفعل لتصحيح المسار
- إضافة مدخل موبايل مستقل داخل نفس تطبيق Next.js على `/m`:
  - `/m/login` تسجيل دخول
  - `/m/home` بصمة دخول/خروج
  - `/m/settings` إعدادات بسيطة
- تحديث بناء APK بحيث يفتح `https://YOUR-RENDER-DOMAIN/m` مباشرة أو يستخدم `MOBILE_WEB_URL` عند التهيئة.

### توصية استراتيجية
حتى لو كان حل `/m` ممتازًا كحل سريع، الأفضل على المدى المتوسط **فصل المنتجين** أو على الأقل **فصل مدخل الموبايل** رسميًا (مسارات/دومين/هوية بصرية/جلسات) لتقليل الالتباس والتداخل.

---

## 2) خريطة المنتج (Product Surfaces) — ما الذي نخدمه؟

### 2.1 الأسطح (Surfaces)
1) **Marketing**: `/` (معلومات + أسعار + طلب ديمو)
2) **Web Dashboard**: `/dashboard/*` (يعتمد على سياق شركة Tenant)
3) **Super Admin**: `/dashboard/super-admin/*` (لا يعتمد على Tenant Context بنفس الطريقة)
4) **Mobile Web Entry**: `/m/*` (يعتمد على Mobile JWT وليس NextAuth)
5) **Mobile APIs**: `/api/mobile/*` (JWT + Device binding + Refresh tokens)

### 2.2 مخطط تدفق عالي المستوى

```
Capacitor WebView
   │
   ├─ يفتح /m  ──> /m/login ──> /m/home (attendance) ──> /m/settings
   │                │
   │                └─ يستخدم /api/mobile/auth/login + x-device-id
   │
   └─ (قديمًا) يفتح /  ──> redirect tenantRequired=1 ──> TenantAccess (اختيار slug)
```

---

## 3) كيف يعمل الـMulti-tenancy حاليًا (Current Tenant Model)

### 3.1 مصادر الـTenant Context
يتم تحديد الـTenant بطريقتين:
- Subdomain: `tenant.<baseDomain>`
- Cookie: `taqam_tenant`

كما يوجد مسار مساعد للتحديد على الدومينات التي لا تدعم subdomains (مثل Render):
- `/t/<slug>` أو `/t/<slug>/<anyPath>`
- أو Query Param `?tenant=<slug>&next=/dashboard`

المنطق المركزي موجود في [proxy.ts](proxy.ts).

### 3.2 قاعدة enforcement الحالية
- عندما يكون المسار `/dashboard` (ما عدا `/dashboard/super-admin` وبعض الاستثناءات)
- ولم يوجد `effectiveTenant`
- على دومين غير localhost

يقوم النظام بعمل redirect إلى `/` مع:
- `tenantRequired=1`
- `next=/dashboard/...`

هذا يشرح رسالة “لازم تختار شركتك” في صفحة اللاندنج [app/(guest)/page.tsx](app/(guest)/page.tsx).

### 3.3 لماذا هذا صحيح للويب وخاطئ للموبايل؟
- الويب: منطقي لأن الـDashboard يحتاج Tenant.
- الموبايل: التطبيق لم يكن يجب أن يفتح `/dashboard` أصلًا؛ يجب أن يعتمد على Mobile JWT ويدخل مباشرة شاشة بصمة.

---

## 4) كيف يعمل Mobile Auth حاليًا (JWT + Device Binding)

الموبايل يستخدم مجموعة API Routes في `app/api/mobile/*`.

### 4.1 متطلبات كل طلب
- `Authorization: Bearer <accessToken>`
- `x-device-id` (إجباري)
- وقد يستخدم `x-mobile-challenge` في عمليات حساسة مثل تسجيل الحضور.

التوثيق الإجباري مع device binding موجود في:
- [lib/mobile/auth.ts](lib/mobile/auth.ts)
- [lib/mobile/device.ts](lib/mobile/device.ts)

### 4.2 أثر device binding
- ميزة: يقلل سرقة التوكن واستخدامه على جهاز آخر.
- مخاطرة: إذا حصلت مشكلة في توليد/تخزين deviceId على العميل، ستظهر `Device mismatch`.

---

## 5) قائمة المشاكل (Issues Register) مع الأولوية

مقياس الأولوية:
- **P0**: يمنع الاستخدام أو يسبب خسارة بيانات/اختراق
- **P1**: يعطل ميزة أساسية أو يسبب تجارب خاطئة متكررة
- **P2**: مشاكل جودة/صيانة/أداء
- **P3**: تحسينات وتجميل

### 5.1 P0 — حدود المنتج غير واضحة (Web vs Mobile)
**الوصف**: نفس التطبيق يخدم “موقع” و“داشبورد” و“موبايل” بدون مدخل رسمي مستقل للموبايل.

**الدليل**:
- نظام التوجيه يفرض اختيار Tenant عند دخول `/dashboard` بدون سياق.
- Capacitor كان يفتح الجذر `/` فيعرض موقع التسويق بدل شاشة التطبيق.

**الأثر**:
- تجربة موبايل خاطئة بالكامل.
- دعم فني صعب: المستخدم لا يميز هل هو في web أم mobile.

**الإصلاح المقترح**:
- قصير المدى: تثبيت `/m` كمدخل رسمي (تم).
- متوسط المدى: فصل واضح للمنتجات:
  1) إما subdomain `m.<domain>`
  2) أو تطبيق Next منفصل للموبايل
  3) أو على الأقل namespace واضح + theme مختلف + Session isolation.

**معايير القبول**:
- فتح التطبيق على الهاتف لا يُظهر landing نهائيًا.
- الدخول من الموبايل لا يطلب Tenant slug.

---

### 5.2 P0 — أمن التوكن في WebView (Storage)
**الوصف**: في `/m` يتم تخزين `refreshToken` في `localStorage` (في `lib/mobile/web-client.ts`).

**الأثر**:
- في سياق WebView، `localStorage` أقل أمانًا من Secure Storage.
- أي XSS على `/m` قد يسرق التوكن.

**الإصلاح المقترح**:
- عند الانتقال للإنتاج الحقيقي للموبايل:
  - استخدام Capacitor Preferences/Secure Storage plugin
  - تشديد CSP وإلغاء أي HTML injection
  - تقليل صلاحية access token
  - ربط refresh token بجهاز + IP/UA checks (جزئيًا موجود)

**معايير القبول**:
- لا توجد refresh tokens في `localStorage` على تطبيق الإنتاج.

---

### 5.3 P1 — تعدد مشاريع موبايل داخل الريبو
**الوصف**: وجود `apps/mobile/` و `mobile-app/` بجانب Capacitor wrapper يخلق تكرارًا.

**الأثر**:
- تضارب في مصدر الحقيقة (Source of truth).
- صعوبة صيانة/بناء/إصدار.

**الإصلاح المقترح**:
- قرار واضح: هل نستخدم Capacitor فقط؟ أم Expo/React Native؟
- بعد القرار: أرشفة/حذف المجلدات غير المستخدمة (بعد تأكيد).
- توحيد مكتبات auth وdevice وattendance لتقليل النسخ.

**معايير القبول**:
- مسار واحد رسمي للموبايل + CI يبني منه.

---

### 5.4 P1 — اختيار استراتيجية Tenant واحدة في بيئة Render
**الوصف**: دعم subdomain + cookie + path + query يجعل المنطق متعدد المسارات.

**الأثر**:
- كثرة edge cases.
- سلوك غير متوقع عند التنقل بين روابط.

**الإصلاح المقترح**:
- في Render (بدون DNS): اعتماد path-based tenant كاستراتيجية أساسية:
  - `/t/<slug>/dashboard/...`
  - ويصبح cookie مجرد تحسين.
- في بيئة DNS كاملة: يمكن دعم subdomain.

**معايير القبول**:
- كل الروابط المستنسخة/المشاركة تعمل بدون “اختيار tenant” متكرر.

---

### 5.5 P1 — عدم وضوح semantics الحذف (Soft vs Hard)
**الوصف**: “حذف موظف/شركة” قد يعني إيقاف/حذف منطقي/حذف نهائي.

**الأثر**:
- مخاطر على السجلات المالية/الحضور.
- توقعات مستخدم خاطئة.

**الإصلاح المقترح**:
- تعريف رسمي للعمليات:
  - Tenant: `ACTIVE/SUSPENDED/DELETED?` أو Soft delete flag + إخفاء.
  - Employee: Prefer soft-delete مع تعطيل الحساب.
- إضافة شاشة توضح أثر الحذف (what gets removed vs archived).

**معايير القبول**:
- لا يمكن حذف كيان يؤثر على سجلات رسمية بدون تأكيدين + صلاحية.

---

### 5.6 P2 — اعتماد كبير على redirects وquery flags
**الوصف**: `tenantRequired=1` و `next=` هي حلول UX لكنها قد تؤدي إلى تداخل.

**الأثر**:
- ظهور واجهات “مساعدة” في سياقات خاطئة.

**الإصلاح المقترح**:
- للويب: صفحة اختيار tenant مستقلة `/select-tenant` بدل embed داخل landing.
- للموبايل: ضمان أن `/m` لا يعتمد على نفس flags.

---

### 5.7 P2 — قيود Render (No shell) وتأثيرها على DB migrations
**الوصف**: صعوبة تشغيل migrations يدويًا.

**الأثر**:
- خطر drift بين schema والـDB.

**الإصلاح المقترح**:
- سياسة واضحة:
  - في dev: `prisma migrate dev`
  - في Render: تشغيل `prisma db push` أو `prisma migrate deploy` حسب الاستراتيجية
- توثيق متى نستخدم push vs migrate.

---

## 6) خطة إصلاح مرحلية (Roadmap)

### المرحلة A (1–3 أيام) — تثبيت التجربة الأساسية
- اعتماد `/m` كمدخل رسمي للموبايل.
- إضافة README صغير للموبايل داخل الريبو يشرح:
  - URL
  - headers المطلوبة
  - قيود الحساب (لازم يكون Employee)
- إضافة اختبار smoke بسيط:
  - `/m` يوجّه إلى `/m/login` إن لم يوجد session.

**مخرجات**: تجربة موبايل مستقرة.

### المرحلة B (1–2 أسبوع) — توحيد الاستراتيجيات وتقليل التعقيد
- قرار Tenant Strategy في Render: path-based رسمي.
- إنشاء صفحة `/select-tenant` بدل رسائل داخل landing.
- توحيد mobile client libraries (حتى لو بقي أكثر من واجهة).

**مخرجات**: عدد أقل من edge-cases.

### المرحلة C (2–6 أسابيع) — صلابة أمنية وإصدارات موبايل
- نقل refresh token إلى Secure Storage.
- تحسين CSP وHeaders.
- فصل build pipeline للموبايل: نسخة versioned + release process.

**مخرجات**: جاهزية إنتاجية أعلى للموبايل.

---

## 7) اختبارات ومعايير قبول (Acceptance & QA)

### 7.1 سيناريوهات موبايل
1) فتح التطبيق لأول مرة → `/m/login`.
2) تسجيل دخول بموظف → `/m/home`.
3) تنفيذ بصمة دخول/خروج:
   - يحصل client على nonce من `/api/mobile/auth/challenge`
   - يرسلها في `x-mobile-challenge` إلى `/api/mobile/attendance`
4) logout-all → يرجع `/m/login`.

### 7.2 سيناريوهات Tenancy للويب
1) الدخول على `/dashboard` بدون tenant على Render domain → redirect إلى اختيار tenant (مسار رسمي).
2) الدخول عبر `/t/<slug>/dashboard` → يعمل بدون خطوات إضافية.

---

## 8) ملاحظات تصميم (Design Notes) — قرارات يجب حسمها

1) هل “الموبايل” منتج مستقل أم مجرد wrapper؟
2) هل tenant strategy الأساسية هي subdomain أم path؟ (البيئة تحدد)
3) هل نسمح لـ SUPER_ADMIN باستخدام `/m`؟ غالبًا لا.
4) هل attendance في الموبايل يحتاج offline mode؟ (قرار لاحق)

---

## 9) قائمة ملفات مرجعية (Key References)

- Multi-tenant + redirects: [proxy.ts](proxy.ts)
- Landing message for tenant selection: [app/(guest)/page.tsx](app/(guest)/page.tsx)
- Mobile auth (device binding): [lib/mobile/auth.ts](lib/mobile/auth.ts)
- Mobile device headers: [lib/mobile/device.ts](lib/mobile/device.ts)
- Mobile login route: [app/api/mobile/auth/login/route.ts](app/api/mobile/auth/login/route.ts)
- Mobile entry UI:
  - [app/m/page.tsx](app/m/page.tsx)
  - [app/m/login/page.tsx](app/m/login/page.tsx)
  - [app/m/home/page.tsx](app/m/home/page.tsx)
  - [app/m/settings/page.tsx](app/m/settings/page.tsx)

---

## 10) ما الذي أحتاجه منك (قرارات فقط)

لو تريد أن نبدأ “إصلاح شامل” فعليًا بعد هذه الوثيقة، أحتاج منك تأكيد 3 قرارات:
1) هل نعتمد Capacitor + `/m` كحل الموبايل الرسمي؟ أم Expo؟
2) هل نثبت tenant strategy في Render على path-based (`/t/<slug>`)؟
3) هل الحذف يكون Soft-delete فقط (مع إخفاء) أم Hard-delete لبعض الكيانات؟
