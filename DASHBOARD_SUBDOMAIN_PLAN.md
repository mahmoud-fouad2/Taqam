# خطة تطوير لوحة التحكم + نظام النطاقات الفرعية (Subdomains)

> **تاريخ الإعداد:** أبريل 2026  
> **المنصة:** طاقم (Taqam) — نظام إدارة الموارد البشرية SaaS

---

## 📊 الوضع الحالي

### لوحة التحكم (Dashboard)

- **35+ قسم** مبني بالفعل (الموظفون، الحضور، الرواتب، التوظيف، الأداء...)
- **التنقل:** Sidebar + Header + Breadcrumb
- **اللغة:** عربي/إنجليزي + RTL كامل
- **الثيم:** Light/Dark (تم ترقية الألوان من cyan إلى blue احترافي)
- **الأدوار:** SUPER_ADMIN / TENANT_ADMIN / HR_MANAGER / MANAGER / EMPLOYEE

### نظام Tenant الحالي

- **Resolution:** Cookie-based (`taqam_tenant`)
- **وضع Subdomain:** `https://company.taqam.net/dashboard`
- **وضع Path (fallback):** `https://taqam.net/t/company/dashboard` (Render/Vercel)
- **الاختيار:** تلقائي عبر `TAQAM_TENANT_URL_MODE` (auto/subdomain/path)
- **النطاقات المحجوزة:** www, admin, app, api

---

## 🎯 خطة التطوير

### المحور الأول: النطاقات الفرعية (Subdomain Infrastructure)

#### Phase 1: Wildcard DNS + SSL

- **المهام:**
  - [ ] إعداد wildcard DNS record: `*.taqam.net → server IP`
  - [ ] إعداد wildcard SSL certificate (Let's Encrypt أو Cloudflare)
  - [ ] تحديث `render.yaml` لدعم custom domains
  - [ ] اختبار الوصول عبر `company1.taqam.net`

#### Phase 2: Next.js Middleware للنطاقات الفرعية

- **المهام:**
  - [ ] إنشاء `middleware.ts` في root المشروع:
    ```
    1. استخراج subdomain من request.headers.host
    2. التحقق من أنه ليس نطاق محجوز
    3. البحث عن الـ Tenant في قاعدة البيانات
    4. حقن tenant slug في cookie + headers
    5. توجيه المستخدم للـ dashboard
    ```
  - [ ] Cache tenant lookup بـ Redis/Edge Cache (لتجنب DB query كل request)
  - [ ] Rewrite `/dashboard` → يقرأ tenant من subdomain تلقائياً

#### Phase 3: Custom Domains لكل شركة

- **المهام:**
  - [ ] إضافة `customDomain` field في جدول `Tenant` بقاعدة البيانات
  - [ ] API endpoint: `PUT /api/admin/tenants/:id/domain` لربط domain مخصص
  - [ ] في Middleware: التحقق من custom domain أولاً → ثم subdomain
  - [ ] DNS verification flow:
    1. الشركة تضيف CNAME record يشير إلى `custom.taqam.net`
    2. المنصة تتحقق من DNS
    3. إصدار SSL تلقائي
  - [ ] UI في إعدادات الشركة لإدارة النطاق المخصص

#### Phase 4: Tenant Isolation المتقدم

- **المهام:**
  - [ ] كل tenant لديه:
    - شعار + ألوان مخصصة (white-labeling)
    - صفحة تسجيل دخول مخصصة
    - favicon مخصص
  - [ ] `TenantBranding` جدول جديد:
    ```prisma
    model TenantBranding {
      id          String  @id @default(cuid())
      tenantId    String  @unique
      tenant      Tenant  @relation(fields: [tenantId], references: [id])
      logoUrl     String?
      faviconUrl  String?
      primaryColor String @default("#2563eb")
      loginBgUrl  String?
    }
    ```
  - [ ] Dynamic theme loading based on tenant branding

---

### المحور الثاني: تطوير لوحة التحكم (Dashboard Enhancements)

#### Phase 5: الصفحة الرئيسية الذكية

الصفحة الرئيسية حالياً بسيطة. المطلوب dashboard ذكي:

- [x] **بطاقات إحصائية** (KPI Cards):
  - إجمالي الموظفين (+ نسبة التغيير الشهري)
  - الحاضرون اليوم (+ المتأخرون + الغائبون)
  - طلبات الإجازات المعلقة
  - إجمالي الرواتب الشهرية
  - الوظائف الشاغرة النشطة

- [x] **رسوم بيانية** (Charts):
  - الحضور الأسبوعي (bar chart)
  - توزيع الموظفين حسب القسم (pie chart)
  - الرواتب الشهرية (line chart - آخر 6 أشهر)
  - أنواع الإجازات الأكثر استخداماً

- [x] **آخر النشاطات** (Activity Feed):
  - آخر 10 عمليات (تسجيل حضور، طلب إجازة، إضافة موظف...)

- [x] **الإجراءات السريعة** (Quick Actions):
  - إضافة موظف جديد
  - تسجيل حضور يدوي
  - تشغيل الرواتب
  - إنشاء طلب

- [x] **تحيات ذكية**:
  - "صباح الخير، أحمد! لديك 3 طلبات بانتظار الموافقة"
  - عرض مختلف حسب الدور (TENANT_ADMIN vs EMPLOYEE)

#### Phase 6: نظام التقارير المتقدم

- [x] **تقرير الحضور الشامل:**
  - فلتر بالقسم + الفترة + الموظف
  - Export إلى Excel/PDF
  - رسوم بيانية تفاعلية
- [x] **تقرير الرواتب:**
  - ملخص شهري مقارن
  - تفاصيل GOSI + ضريبة
  - Export بصيغ WPS/SARIE

- [x] **تقرير الإجازات:**
  - أرصدة كل الموظفين
  - أنماط الاستخدام
  - تنبيهات الأرصدة المنخفضة

- [x] **تقرير التوظيف:**
  - Pipeline funnel (المتقدمون → المقابلات → العروض → التوظيف)
  - متوسط وقت التوظيف

#### Phase 7: إدارة المستندات

- [x] **مستودع مستندات** لكل موظف:
  - عقد العمل + الملحقات
  - الهوية الوطنية / الإقامة
  - الشهادات
  - خطابات (خطاب تعريف، خطاب راتب)
- [x] **توليد خطابات تلقائي:**
  - قوالب خطابات (تعريف، راتب، خبرة)
  - PDF generation مع شعار الشركة
  - توقيع إلكتروني

#### Phase 8: نظام التنبيهات المتقدم

- [x] **Dashboard notifications center:**
  - Inbox مع فلتر (الكل / غير مقروء / مهم)
  - Real-time updates (WebSocket أو SSE)
  - Notification preferences per event type

- [x] **تنبيهات ذكية:**
  - انتهاء الإقامة / الهوية قبل 30 يوم
  - انتهاء فترة التجربة
  - أعياد الميلاد
  - ذكرى التوظيف
  - أرصدة إجازات منخفضة

#### Phase 9: نظام الأدوار المتقدم (RBAC v2)

- [x] **Custom roles:** السماح للشركة بإنشاء أدوار مخصصة
- [x] **Granular permissions:**
  ```
  employees.view / employees.create / employees.edit / employees.delete
  payroll.view / payroll.run / payroll.export
  leaves.approve / leaves.view_all
  reports.view / reports.export
  settings.manage
  ```
- [x] **UI لإدارة الصلاحيات:**
  - مصفوفة صلاحيات (matrix) مع checkboxes
  - أدوار افتراضية (Admin / HR / Manager / Employee)
  - أدوار مخصصة قابلة للإنشاء

---

### المحور الثالث: التكاملات والأتمتة

#### Phase 10: التكاملات السعودية

- [x] **GOSI الآلي:**
  - حساب اشتراكات GOSI تلقائياً من بيانات الموظفين
  - تصدير ملف GOSI الشهري تلقائياً
  - تسجيل موظفين جدد عبر API

- [x] **مدد Mudad:**
  - تصدير ملفات الرواتب بتنسيق مدد
  - تكامل مباشر مع منصة مدد (API v2)

- [x] **مقيم Muqeem:**
  - التحقق من صلاحية الإقامة
  - تنبيهات انتهاء
  - تحديث بيانات تلقائي

- [x] **مسير Musier:**
  - حماية الأجور WPS
  - ملف SIF الشهري

#### Phase 11: API Webhooks

- [x] **نظام Webhooks:**
  - URLs مخصصة لكل حدث
  - Events: employee.created, leave.approved, payroll.processed, attendance.checkin
  - Retry mechanism (3 محاولات)
  - Webhook logs + debugging

#### Phase 12: SSO و SAML

- [x] **تسجيل دخول موحد:**
  - Microsoft Entra ID (Azure AD)
  - Google Workspace
  - SAML 2.0 generic
- [x] **إعداد SSO** من إعدادات الشركة

---

## 📐 الأولويات

| المرحلة                  | الأولوية  | التبعيات   |
| ------------------------ | --------- | ---------- |
| Phase 1: Wildcard DNS    | 🔴 عالية  | بنية تحتية |
| Phase 2: Middleware      | 🔴 عالية  | Phase 1    |
| Phase 5: Dashboard ذكي   | 🔴 عالية  | مستقل      |
| Phase 6: تقارير          | 🟡 متوسطة | Phase 5    |
| Phase 3: Custom Domains  | 🟡 متوسطة | Phase 2    |
| Phase 4: White-labeling  | 🟡 متوسطة | Phase 3    |
| Phase 7: مستندات         | 🟡 متوسطة | مستقل      |
| Phase 8: تنبيهات         | 🟡 متوسطة | مستقل      |
| Phase 9: RBAC v2         | 🟡 متوسطة | مستقل      |
| Phase 10: تكاملات سعودية | 🟢 منخفضة | Phase 5    |
| Phase 11: Webhooks       | 🟢 منخفضة | مستقل      |
| Phase 12: SSO            | 🟢 منخفضة | مستقل      |

---

## 🔧 التغييرات التقنية المطلوبة

### قاعدة البيانات

```prisma
// إضافات مقترحة لـ schema.prisma

model TenantBranding {
  id           String  @id @default(cuid())
  tenantId     String  @unique
  tenant       Tenant  @relation(fields: [tenantId], references: [id])
  logoUrl      String?
  faviconUrl   String?
  primaryColor String  @default("#2563eb")
  loginBgUrl   String?
  customDomain String? @unique
  domainVerified Boolean @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model WebhookEndpoint {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  url       String
  events    String[] // ["employee.created", "leave.approved"]
  secret    String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
}

model WebhookLog {
  id           String   @id @default(cuid())
  endpointId   String
  endpoint     WebhookEndpoint @relation(fields: [endpointId], references: [id])
  event        String
  payload      Json
  statusCode   Int?
  response     String?
  attempts     Int      @default(0)
  lastAttempt  DateTime?
  createdAt    DateTime @default(now())
}

model CustomRole {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  name        String
  nameAr      String?
  permissions String[] // ["employees.view", "payroll.run"]
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### الملفات الجديدة

```
middleware.ts                              # Root middleware (subdomain routing)
lib/tenant-branding.ts                     # Tenant branding utilities
lib/webhooks/                              # Webhook system
  ├── dispatcher.ts                        # Event dispatcher
  ├── retry.ts                             # Retry mechanism
  └── schemas.ts                           # Event payload schemas
app/api/admin/tenants/[id]/domain/route.ts # Custom domain management
app/api/webhooks/                          # Webhook CRUD
app/dashboard/documents/                   # Document management
app/dashboard/reports/advanced/            # Advanced reports
```

---

## ✅ معايير الجودة

- [x] كل endpoint API جديد يمر عبر `requireTenantSession()` — لا يوجد وصول بدون مصادقة
- [x] كل بيانات Tenant معزولة بـ `tenantId` filter
- [ ] Custom domains يتم التحقق من ملكيتها بـ DNS verification
- [x] Webhooks تُرسل مع HMAC signature للتحقق
- [x] الصلاحيات المخصصة لا تسمح بتصعيد الامتيازات
- [x] كل التقارير محددة بنطاق الـ Tenant فقط
- [x] TypeScript strict mode — صفر أخطاء

---

> **النتيجة المتوقعة:** منصة SaaS متعددة المستأجرين بمستوى enterprise مع نطاقات فرعية، white-labeling، تكاملات سعودية، ونظام صلاحيات متقدم.
