# 🚀 منصة أجور (Ujoors) - الخطة الاستراتيجية الشاملة

> ⛔ **تحذير: هذا الملف غير قابل للحذف نهائيًا**
>
> هذا الملف هو **الخطة الأصلية الحقيقية** (Canonical Plan) لمشروع Ujoors.
> - ✅ مسموح: التحديث والتحسين والإضافة (بدون حذف الأقسام)
> - ❌ ممنوع: الحذف أو إعادة الإنشاء من الصفر
>
> آخر تحديث: 2026-01-24

> **مستوحاة من jisr.net** - منصة الموارد البشرية السعودية الرائدة  
> **Domain-Driven Design + Microservices Architecture**  
> **خطة التنفيذ: 24 شهراً**

---

## 📊 نظرة عامة على المنصة

منصة أجور (Ujoors) هي نظام شامل يجمع بين إدارة الموارد البشرية (HR) والعمليات المالية في منصة واحدة، مصممة خصيصاً للسوق السعودي والشرق الأوسط.

### 🎯 الخدمات الرئيسية (8 Suites):

1. **Core HR Suite** - إدارة الموارد البشرية الأساسية
2. **Talent Suite** - إدارة المواهب والتوظيف  
3. **Spend Suite** - إدارة النفقات والمصروفات
4. **Payroll Management** - إدارة الرواتب والأجور
5. **Time & Attendance** - الحضور والانصراف
6. **Compliance Suite** - الامتثال (GOSI, Muqeem, WPS, Mudad, ZATCA)
7. **Performance Management** - إدارة الأداء
8. **Learning Management** - إدارة التدريب والتطوير

---

## 🧩 نموذج SaaS (Multi-Tenant) المطلوب بالضبط

### ✅ الاسم والنطاق
- اسم المنصة: **Ujoors (أجور)** (ليس Jisr)
- Multi-tenant SaaS مع Subdomains بالشكل: `company.mydomain.com` (مثال: `acme.ujoors.com`)
- (مرحلة لاحقة اختيارية) دعم Custom Domain لكل شركة: `hr.company.com`

### ✅ لا يوجد Free Plan ولا Self-Signup للشركات
- لا يوجد تسجيل شركة ذاتي (Self-serve signup) ولا خطة مجانية.
- دخول الشركات يكون عبر:
  - نموذج “طلب اشتراك/تواصل” في Landing Page + بيانات الشركة + عدد الموظفين
  - ثم فريق Ujoors (Super Admin) ينشئ Tenant ويعمل Setup للشركة

### ✅ أدوار الوصول (مهم)
- **Ujoors Super Admin (داخلي)**: إنشاء Tenants + تهيئة أولية + إدارة الفواتير/العقود + التحكم في الثيمات المتاحة.
- **Company Admin (Tenant Admin)**: إدارة مستخدمي الشركة وصلاحياتهم وكل بياناتها.
- **Manager / Employee**: بوابات داخلية حسب الصلاحيات.

### ✅ تعريف الـTenant (كيف نحدد الشركة في كل Request)
- الأساس: Host header (subdomain) → `tenantSlug`
- بديل داخلي/للتجارب: Header `x-tenant` (للاستخدام الداخلي فقط)
- قاعدة ذهبية: لا يوجد أي Query أو API بدون `tenantId` (مستخرج من الـTenant Resolver)

### ✅ i18n وRTL
- المنصة ثنائية اللغة: **عربي + إنجليزي** لكل الشاشات.
- لكل شركة: Default language + إمكانية التبديل للمستخدم.
- RTL افتراضي للعربي مع تصميم sidebar يمين مثل الصورة.

---

## ✅ Roadmap التنفيذ الحقيقي (6 مراحل) — 10 TODOs لكل مرحلة

> هذه هي الخطة التنفيذية التي نمشي عليها داخل هذا الريبو الحالي.
> ملاحظة: الريبو الحالي هو تطبيق Next.js واحد (وليس Monorepo كامل بعد). سنطوّر تدريجيًا باتجاه الـTarget Architecture بدون هدم ما تم بناؤه.

### Phase 1 — Foundation & UX Baseline ✅ COMPLETED
- [x] RTL: نقل الـSidebar لليمين في العربية + ضبط `dir`
- [x] Design tokens (shadcn) + أساس نظام الثيمين
- [x] إضافة خط IBM Plex Sans Arabic محليًا وربطه كـ default
- [x] i18n فعلي (AR/EN) باستخدام next-intl بدل hardcoded
- [x] Multi-tenant resolver (subdomain) + tenant context utilities
- [x] Auth skeleton + guards (بلا self-signup للشركات)
- [x] تنظيف بقايا التمبلت (Get Pro/Free/demo)
- [x] توثيق تعريفات المنتج (Roles/Tenant/Locale/Theme)
- [x] Landing UX أساس للمنصة
- [x] Build/Lint بدون كسر

### Phase 2 — Super Admin & Tenant Provisioning ✅ COMPLETED
- [x] مساحة `/dashboard/super-admin` محمية (مبدئيًا)
- [x] شاشة Tenants (قائمة/بحث/فلترة/حالة)
- [x] Create Tenant Wizard (slug + إعدادات + admin)
- [x] Company Admin + Invite placeholder
- [x] سياسة منع العمل بدون `tenantId` *(جزئي — يحتاج middleware كامل عند APIs)*
- [x] Tenant Settings (لغة/ثيم/باقة) + صفحات التفاصيل
- [x] Audit Log مبدئي
- [x] Soft suspend/delete (UI placeholder)
- [x] Landing Page + نموذج “طلب اشتراك” (بدون signup)
- [x] Inbox طلبات الاشتراك

### Phase 3 — Core HR MVP (الهيكل التنظيمي والموظفين) ✅ COMPLETED
- [x] Organization: Company profile + Branches (أساسي)
- [x] Departments: CRUD + شجرة بسيطة
- [x] Job Titles/Positions: CRUD وربطها بالموظفين
- [x] Employees: إنشاء/تعديل/عرض (الملف الأساسي)
- [x] Employee lifecycle (active/onboarding/terminated)
- [ ] Documents: رفع/عرض (Local dev الآن ثم R2)
- [ ] Company RBAC (Company Admin/Manager/Employee) + permissions matrix
- [ ] Bulk import skeleton (CSV) + validation
- [ ] Search/filters قوية على الموظفين
- [ ] UX production polish (empty/loading/error states)

### Phase 4 — Time & Attendance MVP
- [ ] Shifts + rules (late/early/overtime) (MVP)
- [ ] Attendance records (manual check-in/out)
- [ ] Requests workflow (تصحيح حضور/إذن)
- [ ] Calendar view + monthly summary
- [ ] Reports (weekly/monthly)
- [ ] Integrate attendance مع employeeId
- [ ] Notifications skeleton (in-app)
- [ ] Multi-tenant isolation tests
- [ ] Performance for tables (virtualization عند الحاجة)
- [ ] API contracts skeleton للـattendance service

### Phase 5 — Payroll & Saudi Compliance MVP
- [ ] Payroll cycles + salary components
- [ ] Payroll run (preview/approve)
- [ ] Payslip (PDF placeholder)
- [ ] WPS export placeholder
- [ ] GOSI/Mudad/Muqeem adapters placeholders
- [ ] End-of-service calculation MVP
- [ ] Payroll audit trail
- [ ] Payroll RBAC (قيود صارمة)
- [ ] QA سيناريوهات عربية/إنجليزية + RTL reports
- [ ] API contracts skeleton للـpayroll service

### Phase 6 — Production Hardening & Scale (Render + R2)
- [ ] Render deploy blueprint (env vars/health checks)
- [ ] PostgreSQL + Prisma foundation + migrations
- [ ] Cloudflare R2 integration للملفات + سياسة وصول
- [ ] Background jobs (exports/emails) (BullMQ/Redis لاحقًا)
- [ ] Observability (Sentry + logs)
- [ ] Security hardening (rate limiting + CSRF + session policy)
- [ ] Backup/Restore plan + runbooks
- [ ] Integration layer (webhooks inbound/outbound)
- [ ] Performance budgets (CWV) + regression checks
- [ ] Release process (feature flags + staging + rollbacks)

**Phase Status (مختصر)**
- Phase 1: ✅ Completed (2026-01-24)
- Phase 2: ✅ Completed (2026-01-24)
- Phase 3: ✅ Completed (2026-01-24) — Core HR UI (Departments/Job Titles/Employees/Organization+Branches)
- Phase 4: Not started
- Phase 5: Not started
- Phase 6: Not started

**Phase 3 Notes:**
- تم بناء صفحات Core HR كاملة مع CRUD فعلي (state-based):
  - `/dashboard/departments` — إدارة الأقسام
  - `/dashboard/job-titles` — إدارة المسميات الوظيفية
  - `/dashboard/employees` — إدارة الموظفين (مع فلترة وبحث)
  - `/dashboard/organization` — بيانات الشركة + الفروع
- الترجمات (i18n) محدثة للـ Core HR modules
- Types كاملة في `lib/types/core-hr.ts`
- متبقي: Documents upload (R2)، RBAC matrix، CSV import

---

## 🏗️ البنية المعمارية - Enterprise Architecture

### المبادئ المعمارية الأساسية:

```
📐 Architecture Principles:
├── Domain-Driven Design (DDD)
├── Microservices Architecture  
├── Event-Driven Architecture
├── CQRS Pattern (Command Query Responsibility Segregation)
├── Clean Architecture
├── Multi-Tenancy (Shared DB افتراضيًا + خيار DB-per-Tenant لاحقًا)
└── API-First Design
```

### ملاحظة واقعية (مهمة عشان الخطة ما تبقاش “نظريّة”)
- الريبو الحالي في هذا المسار مبني على قالب UI مرجعي (reference0) وليس Monorepo فعليًا.
- الخطة أدناه تمثل **Target Architecture**؛ وسيتم تحويل المشروع تدريجيًا بدون فقدان أي كود.

### 📁 هيكل المشروع الكامل - Monorepo Structure

```
D:\Mahmoud\hghvadt\Jisr\
│
├── 📁 apps/                                    # Frontend Applications
│   ├── 📁 web-admin/                          # لوحة تحكم الإدارة (Next.js 15)
│   │   ├── app/
│   │   │   ├── (auth)/                        # صفحات المصادقة
│   │   │   ├── dashboard/                     # Dashboard الرئيسي
│   │   │   ├── employees/                     # إدارة الموظفين
│   │   │   ├── departments/                   # إدارة الأقسام
│   │   │   ├── attendance/                    # الحضور
│   │   │   ├── payroll/                       # الرواتب
│   │   │   ├── leaves/                        # الإجازات
│   │   │   ├── recruitment/                   # التوظيف
│   │   │   ├── performance/                   # الأداء
│   │   │   ├── learning/                      # التدريب
│   │   │   ├── expenses/                      # المصروفات
│   │   │   ├── reports/                       # التقارير
│   │   │   ├── settings/                      # الإعدادات
│   │   │   └── api/                          # API Routes
│   │   ├── components/                        # React Components
│   │   ├── lib/                              # Utilities
│   │   ├── public/                           # Static Files
│   │   ├── i18n/                             # Arabic/English
│   │   └── package.json
│   │
│   ├── 📁 web-employee/                       # بوابة الموظفين (Next.js 15)
│   │   ├── app/
│   │   │   ├── dashboard/                     # لوحة الموظف
│   │   │   ├── profile/                       # الملف الشخصي
│   │   │   ├── attendance/                    # سجل الحضور
│   │   │   ├── leaves/                        # طلبات الإجازة
│   │   │   ├── payslips/                      # كشوف الرواتب
│   │   │   ├── documents/                     # المستندات
│   │   │   ├── learning/                      # الدورات التدريبية
│   │   │   └── expenses/                      # المصروفات
│   │   └── package.json
│   │
│   ├── 📁 web-manager/                        # بوابة المديرين (Next.js 15)
│   │   ├── app/
│   │   │   ├── dashboard/                     # لوحة المدير
│   │   │   ├── team/                         # فريق العمل
│   │   │   ├── approvals/                    # الموافقات
│   │   │   ├── performance/                  # تقييم الأداء
│   │   │   └── reports/                      # تقارير الفريق
│   │   └── package.json
│   │
│   ├── 📁 mobile-app/                         # تطبيق الموبايل (React Native + Expo)
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── navigation/
│   │   │   └── services/
│   │   ├── app.json
│   │   └── package.json
│   │
│   └── 📁 landing-page/                       # الموقع التسويقي (Next.js 15)
│       ├── app/
│       │   ├── page.tsx                      # الصفحة الرئيسية
│       │   ├── features/                     # الخصائص
│       │   ├── pricing/                      # الأسعار
│       │   ├── about/                        # من نحن
│       │   └── contact/                      # اتصل بنا
│       └── package.json
│
├── 📁 services/                               # Microservices Backend (NestJS)
│   ├── 📁 api-gateway/                        # API Gateway (NestJS 10)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/                     # معالجة المصادقة
│   │   │   │   ├── employees/                # Proxy للموظفين
│   │   │   │   ├── payroll/                  # Proxy للرواتب
│   │   │   │   └── ...
│   │   │   ├── guards/                       # Route Guards
│   │   │   ├── interceptors/                 # Response Interceptors
│   │   │   ├── filters/                      # Exception Filters
│   │   │   └── main.ts
│   │   ├── test/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── 📁 auth-service/                       # خدمة المصادقة والتفويض (NestJS)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   └── refresh.strategy.ts
│   │   │   │   ├── users/
│   │   │   │   ├── permissions/
│   │   │   │   └── roles/
│   │   │   ├── guards/
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   ├── 📁 hr-service/                         # خدمة الموارد البشرية (NestJS)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── employees/
│   │   │   │   │   ├── employees.controller.ts
│   │   │   │   │   ├── employees.service.ts
│   │   │   │   │   ├── employees.repository.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── departments/
│   │   │   │   ├── job-titles/
│   │   │   │   ├── documents/
│   │   │   │   └── org-chart/
│   │   │   ├── database/
│   │   │   │   ├── prisma/
│   │   │   │   └── migrations/
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   ├── 📁 payroll-service/                    # خدمة الرواتب (NestJS)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── payroll-cycles/
│   │   │   │   ├── salary-structures/
│   │   │   │   ├── allowances/
│   │   │   │   ├── deductions/
│   │   │   │   ├── gosi/                     # حسابات GOSI
│   │   │   │   ├── wps/                      # WPS Export
│   │   │   │   ├── payslips/
│   │   │   │   └── end-of-service/           # نهاية الخدمة
│   │   │   ├── calculators/                  # محركات الحساب
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   ├── 📁 attendance-service/                 # خدمة الحضور والانصراف (NestJS)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── attendance/
│   │   │   │   ├── shifts/
│   │   │   │   ├── schedules/
│   │   │   │   ├── overtime/
│   │   │   │   ├── biometric/                # تكامل البصمة
│   │   │   │   └── geo-location/             # GPS Tracking
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   ├── 📁 recruitment-service/                # خدمة التوظيف (NestJS)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── job-postings/
│   │   │   │   ├── applications/
│   │   │   │   ├── candidates/
│   │   │   │   ├── interviews/
│   │   │   │   ├── offers/
│   │   │   │   ├── onboarding/
│   │   │   │   └── ats/                      # Applicant Tracking System
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   ├── 📁 performance-service/                # خدمة إدارة الأداء (NestJS)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── reviews/
│   │   │   │   ├── goals/                    # OKRs/KPIs
│   │   │   │   ├── feedback/                 # 360 Feedback
│   │   │   │   ├── ratings/
│   │   │   │   └── pip/                      # Performance Improvement Plans
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   ├── 📁 learning-service/                   # خدمة التدريب والتطوير (NestJS)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── courses/
│   │   │   │   ├── learning-paths/
│   │   │   │   ├── certifications/
│   │   │   │   ├── skills/
│   │   │   │   ├── training-calendar/
│   │   │   │   └── lms/                      # Learning Management System
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   ├── 📁 expense-service/                    # خدمة إدارة المصروفات (NestJS)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── expenses/
│   │   │   │   ├── travel/
│   │   │   │   ├── reimbursements/
│   │   │   │   ├── advances/
│   │   │   │   ├── cards/                    # بطاقات الشركة
│   │   │   │   ├── policies/
│   │   │   │   └── ocr/                      # Receipt Scanning
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   ├── 📁 compliance-service/                 # خدمة الامتثال السعودي (NestJS)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── gosi/                     # GOSI Integration
│   │   │   │   ├── wps/                      # WPS System
│   │   │   │   ├── muqeem/                   # Iqama Validation
│   │   │   │   ├── mudad/                    # Insurance
│   │   │   │   ├── qiwa/                     # Qiwa (Nitaqat)
│   │   │   │   ├── zatca/                    # e-Invoice
│   │   │   │   └── labor-office/
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   ├── 📁 notification-service/               # خدمة الإشعارات (NestJS)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── email/                    # SendGrid/SES
│   │   │   │   ├── sms/                      # Twilio/STC
│   │   │   │   ├── push/                     # FCM/APNS
│   │   │   │   ├── in-app/
│   │   │   │   ├── whatsapp/                 # WhatsApp Business
│   │   │   │   └── templates/
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   ├── 📁 analytics-service/                  # خدمة التحليلات والتقارير (NestJS)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── dashboards/
│   │   │   │   ├── reports/
│   │   │   │   ├── metrics/
│   │   │   │   ├── data-warehouse/
│   │   │   │   └── bi/                       # Business Intelligence
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   └── 📁 integration-service/                # خدمة التكاملات الخارجية (NestJS)
│       ├── src/
│       │   ├── modules/
│       │   │   ├── erp/                      # SAP, Oracle, Dynamics
│       │   │   ├── accounting/               # QuickBooks, Xero
│       │   │   ├── calendar/                 # Google, Outlook
│       │   │   ├── slack/
│       │   │   ├── teams/
│       │   │   └── webhooks/
│       │   └── main.ts
│       └── package.json
│
├── 📁 domains/                                # Domain Models (DDD)
│   ├── 📁 employee/                           # نطاق الموظفين
│   │   ├── 📁 domain/                        # Domain Layer
│   │   │   ├── entities/
│   │   │   │   ├── employee.entity.ts
│   │   │   │   └── employee-history.entity.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── employee-id.vo.ts
│   │   │   │   ├── employee-name.vo.ts
│   │   │   │   ├── employee-email.vo.ts
│   │   │   │   ├── national-id.vo.ts
│   │   │   │   └── iqama-number.vo.ts
│   │   │   ├── aggregates/
│   │   │   │   └── employee.aggregate.ts
│   │   │   ├── events/
│   │   │   │   ├── employee-created.event.ts
│   │   │   │   ├── employee-updated.event.ts
│   │   │   │   └── employee-terminated.event.ts
│   │   │   └── repositories/
│   │   │       └── employee.repository.interface.ts
│   │   ├── 📁 application/                   # Application Layer
│   │   │   ├── use-cases/
│   │   │   │   ├── create-employee.use-case.ts
│   │   │   │   ├── update-employee.use-case.ts
│   │   │   │   ├── terminate-employee.use-case.ts
│   │   │   │   └── get-employee.use-case.ts
│   │   │   ├── dtos/
│   │   │   │   ├── create-employee.dto.ts
│   │   │   │   ├── update-employee.dto.ts
│   │   │   │   └── employee-response.dto.ts
│   │   │   └── mappers/
│   │   │       └── employee.mapper.ts
│   │   ├── 📁 infrastructure/                # Infrastructure Layer
│   │   │   ├── persistence/
│   │   │   │   ├── employee.repository.ts
│   │   │   │   └── employee.schema.prisma
│   │   │   └── adapters/
│   │   │       └── employee-api.adapter.ts
│   │   └── 📁 presentation/                  # Presentation Layer
│   │       └── controllers/
│   │           └── employee.controller.ts
│   │
│   ├── 📁 payroll/                           # نطاق الرواتب
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── payroll-cycle.entity.ts
│   │   │   │   └── payroll-entry.entity.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── salary.vo.ts
│   │   │   │   └── allowance.vo.ts
│   │   │   ├── services/
│   │   │   │   ├── salary-calculator.service.ts
│   │   │   │   └── gosi-calculator.service.ts
│   │   │   └── events/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   │
│   ├── 📁 attendance/                        # نطاق الحضور
│   ├── 📁 recruitment/                       # نطاق التوظيف
│   ├── 📁 performance/                       # نطاق الأداء
│   ├── 📁 learning/                          # نطاق التعلم
│   ├── 📁 expense/                           # نطاق المصروفات
│   └── 📁 organization/                      # نطاق المؤسسة
│
├── 📁 packages/                              # Shared Packages
│   ├── 📁 ui/                                # مكتبة المكونات المشتركة
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Button/
│   │   │   │   ├── Input/
│   │   │   │   ├── Table/
│   │   │   │   ├── Modal/
│   │   │   │   └── ...
│   │   │   ├── hooks/
│   │   │   └── utils/
│   │   └── package.json
│   │
│   ├── 📁 config/                            # إعدادات مشتركة
│   │   ├── eslint-config/
│   │   ├── typescript-config/
│   │   └── tailwind-config/
│   │
│   ├── 📁 types/                             # TypeScript Types مشتركة
│   │   ├── src/
│   │   │   ├── employee.types.ts
│   │   │   ├── payroll.types.ts
│   │   │   └── ...
│   │   └── package.json
│   │
│   ├── 📁 utils/                             # دوال مساعدة مشتركة
│   │   ├── src/
│   │   │   ├── date.utils.ts
│   │   │   ├── validation.utils.ts
│   │   │   ├── format.utils.ts
│   │   │   └── ...
│   │   └── package.json
│   │
│   └── 📁 api-client/                        # HTTP Client SDK
│       ├── src/
│       │   ├── clients/
│       │   │   ├── employee.client.ts
│       │   │   ├── payroll.client.ts
│       │   │   └── ...
│       │   └── index.ts
│       └── package.json
│
├── 📁 infrastructure/                        # Infrastructure Layer
│   ├── 📁 database/                          # Database Configurations
│   │   ├── prisma/
│   │   │   ├── schema.prisma                # Main Schema
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   └── mongo/                           # MongoDB (للملفات والتقارير)
│   │
│   ├── 📁 message-queue/                    # Message Queue Setup
│   │   ├── rabbitmq/
│   │   │   ├── config/
│   │   │   └── exchanges/
│   │   └── kafka/                           # Alternative
│   │
│   ├── 📁 cache/                            # Redis Configuration
│   │   ├── redis.config.ts
│   │   └── cache.service.ts
│   │
│   ├── 📁 storage/                          # File Storage
│   │   ├── r2/                              # Cloudflare R2
│   │   └── s3/                              # AWS S3 (Alternative)
│   │
│   └── 📁 monitoring/                       # Monitoring & Observability
│       ├── prometheus/
│       ├── grafana/
│       ├── elk/                             # Elasticsearch, Logstash, Kibana
│       └── sentry/
│
├── 📁 shared/                               # مكتبات DDD المشتركة
│   ├── 📁 core/                             # Core Building Blocks
│   │   ├── result.ts                        # Result Pattern
│   │   ├── guard.ts                         # Input Validation
│   │   ├── use-case.ts                      # Use Case Interface
│   │   └── error.ts                         # Error Handling
│   │
│   ├── 📁 domain/                           # Domain Building Blocks
│   │   ├── entity.ts                        # Entity Base Class
│   │   ├── value-object.ts                  # Value Object Base
│   │   ├── aggregate-root.ts                # Aggregate Root
│   │   ├── domain-event.ts                  # Domain Events
│   │   ├── event-publisher.ts               # Event Publisher
│   │   ├── identifier.ts                    # ID Base
│   │   └── unique-entity-id.ts              # UUID Generator
│   │
│   └── 📁 infrastructure/                   # Infrastructure Helpers
│       ├── http/
│       ├── database/
│       └── messaging/
│
├── 📁 docs/                                 # Documentation
│   ├── 📁 api/                              # API Documentation
│   │   ├── openapi/                         # OpenAPI Specs
│   │   └── postman/                         # Postman Collections
│   ├── 📁 architecture/                     # Architecture Documentation
│   │   ├── ARCHITECTURE.md
│   │   ├── DDD_GUIDE.md
│   │   └── MICROSERVICES.md
│   └── 📁 user-guides/                      # User Documentation
│       ├── admin-guide.md
│       └── employee-guide.md
│
├── 📄 package.json                          # Root Package
├── 📄 turbo.json                            # Turborepo Config
├── 📄 pnpm-workspace.yaml                   # Workspace Definition
├── 📄 docker-compose.yml                    # Docker Services
├── 📄 .env.example                          # Environment Variables
├── 📄 .gitignore
└── 📄 README.md
```

---

## 🎯 خطة التنفيذ التفصيلية: 24 شهراً

### 📅 المرحلة 1: التأسيس والبنية التحتية (شهر 1-3)

#### Sprint 1-2: إعداد البيئة والبنية الأساسية
```
Week 1-2: Project Setup
├── إنشاء Monorepo (Turborepo)
├── Git Strategy (GitFlow)
├── Docker Development Environment
├── CI/CD Pipeline (GitHub Actions)
├── Code Quality Tools (ESLint, Prettier, Husky)
└── Project Documentation

Week 3-4: Core Infrastructure
├── Database Schema Design (Prisma)
├── API Gateway Setup (NestJS)
├── Authentication Service (JWT + OAuth + 2FA)
├── Redis Setup
├── Queue/Jobs (BullMQ على Redis لسهولة Render) + (RabbitMQ اختيارياً لاحقًا)
└── Monitoring Setup (Sentry أولاً + Prometheus/Grafana لاحقًا)
```

#### Sprint 3-4: UI Foundation & Design System
```
Week 5-6: Design System
├── مكتبة UI Components (shadcn/ui كـ Theme A)
├── Theme B: Mantine UI (Mantine Dev reference)
├── Theme System:
│   ├── Dark/Light Mode
│   ├── اختيار الثيم لكل شركة (Tenant Theme)
│   ├── إمكانية تغيير شكل منصة Ujoors نفسها (Admin Switch)
│   └── توحيد “Component Contract” بين الثيمين (Adapter Pattern)
├── RTL Support Implementation
├── Arabic Fonts (Cairo, Almarai, IBM Plex Sans Arabic)
├── Storybook للمكونات (اختياري)
└── Design Tokens System

Week 7-8: Layout & Navigation
├── ✅ Admin Dashboard Layout
├── ✅ Employee Portal Layout
├── ✅ Manager Portal Layout
├── ✅ Responsive Sidebar Navigation
├── ✅ Multi-language Support (AR/EN)
└── ✅ Landing Page
```

---

### 📅 المرحلة 2: Core HR Module (شهر 4-7)

#### Sprint 5-8: Employee Management
```
Week 9-12: Employee Module
├── Employee CRUD Operations
│   ├── قائمة الموظفين (DataTable)
│   ├── إضافة موظف (Multi-step Form)
│   ├── تعديل بيانات الموظف
│   ├── حذف موظف (Soft Delete)
│   └── استعادة موظف
├── Employee Profile
│   ├── المعلومات الشخصية
│   ├── معلومات التوظيف
│   ├── معلومات الراتب
│   ├── جهات الاتصال
│   └── الحالة الوظيفية
├── Employee Documents
│   ├── رفع المستندات (Drag & Drop)
│   ├── أنواع المستندات (ID, Iqama, Contract, etc.)
│   ├── تواريخ الانتهاء والتنبيهات
│   └── معاينة المستندات
├── Employee History & Audit Trail
│   ├── سجل التغييرات
│   ├── تاريخ الترقيات
│   ├── تاريخ النقل
│   └── تاريخ الإجازات
└── Bulk Operations
    ├── استيراد من Excel/CSV
    ├── تصدير إلى Excel/CSV
    └── تحديث جماعي

Week 13-16: Organization Structure
├── Company Structure Setup
│   ├── إعدادات الشركة
│   ├── الفروع والمواقع
│   └── معلومات السجل التجاري
├── Departments Management
│   ├── إنشاء الأقسام
│   ├── الهيكل الإداري للأقسام
│   ├── رؤساء الأقسام
│   └── نقل موظفين بين الأقسام
├── Job Titles & Positions
│   ├── المسميات الوظيفية
│   ├── الدرجات الوظيفية
│   ├── Job Descriptions
│   └── Salary Grades
├── Cost Centers
│   ├── مراكز التكلفة
│   ├── ربط الموظفين بمراكز التكلفة
│   └── تقارير مراكز التكلفة
├── Projects Management
│   ├── إدارة المشاريع
│   ├── تعيين موظفين للمشاريع
│   └── تتبع ساعات المشروع
└── Custom Fields & Forms
    ├── حقول مخصصة للموظفين
    ├── نماذج مخصصة
    └── Workflow Builder
```

#### Sprint 9-12: Leave Management
```
Week 17-20: Leave System
├── Leave Types Configuration
│   ├── أنواع الإجازات (سنوية، مرضية، طارئة، خاصة)
│   ├── الإجازات مدفوعة/غير مدفوعة
│   ├── الحد الأقصى للأيام
│   └── قواعد الاستحقاق
├── Leave Policies & Rules
│   ├── سياسات الإجازة حسب القسم
│   ├── سياسات حسب الجنسية
│   ├── احتساب الرصيد
│   └── قواعد الترحيل
├── Leave Request Workflow
│   ├── نموذج طلب الإجازة
│   ├── نظام الموافقات متعدد المستويات
│   ├── إلغاء الإجازة
│   └── تعديل الإجازة
├── Leave Calendar & Balance
│   ├── تقويم الإجازات
│   ├── رصيد الإجازات الحالي
│   ├── الإجازات المستخدمة
│   └── الإجازات المتبقية
├── Manager Approval System
│   ├── قائمة الطلبات المعلقة
│   ├── الموافقة/الرفض
│   ├── التعليقات
│   └── الإشعارات
├── Leave Accrual Calculation
│   ├── احتساب تلقائي شهري
│   ├── الاستحقاق حسب مدة الخدمة
│   └── تقارير الاستحقاق
└── Public Holidays Management
    ├── تقويم العطلات الرسمية
    ├── العطلات السعودية
    ├── العطلات حسب الموقع
    └── استبدال العطلات

Week 21-24: Document Management
├── Document Templates
│   ├── قوالب العقود
│   ├── قوالب الخطابات
│   ├── قوالب الشهادات
│   └── محرر القوالب
├── Document Generation (PDF)
│   ├── توليد العقود تلقائياً
│   ├── توليد الشهادات
│   ├── خطابات التعريف
│   └── التصدير لـ PDF
├── Digital Signatures
│   ├── توقيع إلكتروني
│   ├── OTP Verification
│   └── تتبع التوقيعات
├── Document Workflows
│   ├── إرسال للموافقة
│   ├── تتبع حالة المستند
│   └── التنبيهات
└── Document Archiving
    ├── الأرشفة التلقائية
    ├── البحث في الأرشيف
    └── استرجاع المستندات
```

---

### 📅 المرحلة 3: Payroll Module (شهر 8-11)

#### Sprint 13-16: Payroll Core
```
Week 25-28: Payroll Engine
├── Salary Structure Configuration
│   ├── مكونات الراتب
│   ├── الراتب الأساسي
│   ├── البدلات (سكن، نقل، أخرى)
│   ├── العمولات
│   └── المكافآت
├── Payroll Calculation Engine
│   ├── محرك حساب الراتب
│   ├── حساب الأيام الفعلية
│   ├── خصم الغياب
│   ├── احتساب الإضافي
│   └── التقريب
├── Allowances & Deductions
│   ├── إضافة بدلات
│   ├── إضافة خصومات
│   ├── بدلات ثابتة/متغيرة
│   └── خصومات ثابتة/متغيرة
├── Overtime Calculation
│   ├── ساعات إضافية عادية (150%)
│   ├── ساعات إضافية في العطل (200%)
│   ├── قواعد الإضافي
│   └── حدود ساعات الإضافي
├── GOSI Calculation
│   ├── نسبة الموظف (10% أو 22%)
│   ├── نسبة صاحب العمل (12%)
│   ├── الحد الأقصى للاشتراك
│   └── استثناءات GOSI
└── Tax Calculation (إن وجد)
    ├── الضريبة على الدخل
    ├── الشرائح الضريبية
    └── الإعفاءات

Week 29-32: Payroll Processing
├── Payroll Run Processing
│   ├── إنشاء دورة رواتب جديدة
│   ├── اختيار الموظفين
│   ├── المعاينة قبل المعالجة
│   ├── معالجة الرواتب
│   └── إعادة معالجة
├── Payroll Approval Workflow
│   ├── مراجعة الرواتب
│   ├── الموافقة متعددة المستويات
│   ├── التعليقات والملاحظات
│   └── القفل النهائي
├── Payslip Generation (AR/EN)
│   ├── كشف راتب عربي
│   ├── كشف راتب إنجليزي
│   ├── إرسال بالبريد الإلكتروني
│   └── تحميل PDF
├── Bank File Generation
│   ├── ملف البنك (STP/SWIFT)
│   ├── اختيار البنوك
│   ├── تنسيقات مختلفة
│   └── تأمين الملف
├── WPS File Export
│   ├── ملف WPS المعتمد
│   ├── Validation قبل التصدير
│   ├── Molsa Format
│   └── SIF Format
└── Payroll Reports & Analytics
    ├── تقرير ملخص الرواتب
    ├── تقرير التكلفة حسب القسم
    ├── تحليل الرواتب
    └── مقارنات شهرية
```

#### Sprint 17-20: Saudi Compliance
```
Week 33-36: Compliance Integration
├── GOSI Integration & Reporting
│   ├── تسجيل موظف جديد في GOSI
│   ├── تحديث بيانات GOSI
│   ├── إلغاء اشتراك موظف
│   ├── تقرير GOSI الشهري
│   └── دفع مستحقات GOSI
├── Muqeem (Iqama) Integration
│   ├── التحقق من صحة رقم الإقامة
│   ├── التحقق من تاريخ الانتهاء
│   ├── تنبيهات قبل الانتهاء
│   └── API Integration with Muqeem
├── WPS Submission
│   ├── إنشاء ملف WPS
│   ├── رفع إلى بنك السعودية
│   ├── تتبع حالة WPS
│   └── الشهادات والتقارير
├── Mudad Insurance Integration
│   ├── احتساب التأمين الطبي
│   ├── تسجيل الموظفين
│   └── المطالبات
├── End of Service Calculation
│   ├── حساب نهاية الخدمة (قانون العمل السعودي)
│   ├── سنوات الخدمة
│   ├── آخر راتب
│   ├── أيام الإجازات المتبقية
│   └── تقرير نهاية الخدمة
└── Saudi Labor Law Compliance
    ├── ساعات العمل القانونية
    ├── ساعات الإضافي المسموحة
    ├── قواعد الإجازات
    └── الحد الأدنى للأجور

Week 37-40: Advanced Payroll
├── Salary Loans & Advances
│   ├── طلب سلفة
│   ├── الموافقة على السلفة
│   ├── جدول السداد
│   ├── خصم تلقائي من الراتب
│   └── تقارير السلف
├── Final Settlement Processing
│   ├── حساب التسوية النهائية
│   ├── آخر راتب
│   ├── بدل الإجازات
│   ├── نهاية الخدمة
│   ├── الخصومات المستحقة
│   └── الصافي النهائي
├── Payroll Adjustments
│   ├── تعديلات على الراتب
│   ├── استرجاع مبالغ
│   ├── تصحيحات
│   └── تعديلات ما بعد المعالجة
├── Payroll History & Audit
│   ├── سجل جميع الرواتب
│   ├── تتبع التغييرات
│   ├── Audit Trail
│   └── التقارير التاريخية
└── Multi-company Payroll
    ├── رواتب عدة شركات
    ├── عملات مختلفة
    ├── سياسات مختلفة
    └── تقارير موحدة
```

---

### 📅 المرحلة 4: Attendance & Time Management (شهر 12-14)

#### Sprint 21-24: Attendance System
```
Week 41-44: Core Attendance
├── Check-in/Check-out System
│   ├── تسجيل الحضور (Mobile/Web/Biometric)
│   ├── تسجيل الانصراف
│   ├── تسجيل البصمة
│   ├── GPS Location Tracking
│   └── Face Recognition (Optional)
├── Shift Management
│   ├── إنشاء الورديات
│   ├── ورديات صباحية/مسائية/ليلية
│   ├── ورديات دوارة
│   ├── تعيين موظفين للورديات
│   └── تبديل الورديات
├── Work Schedules & Rosters
│   ├── جداول العمل الأسبوعية
│   ├── جداول العمل الشهرية
│   ├── أيام العمل المرنة
│   ├── العمل من المنزل
│   └── نشر الجداول
├── GPS-based Check-in
│   ├── تحديد مواقع العمل
│   ├── نطاق GPS مسموح
│   ├── التحقق من الموقع
│   └── تنبيهات خارج النطاق
├── Biometric Integration
│   ├── تكامل مع أجهزة البصمة
│   ├── ZKTeco Integration
│   ├── Suprema Integration
│   └── API للأجهزة الأخرى
└── Attendance Policies
    ├── سياسات التأخير
    ├── سياسات الغياب
    ├── المغادرة المبكرة
    └── الجزاءات

Week 45-48: Time Tracking
├── Working Hours Calculation
│   ├── حساب ساعات العمل الفعلية
│   ├── خصم فترات الراحة
│   ├── الحد الأدنى لساعات العمل
│   └── المرونة في الساعات
├── Overtime Tracking
│   ├── احتساب الإضافي تلقائياً
│   ├── طلب موافقة على الإضافي
│   ├── حدود الإضافي
│   └── تقارير الإضافي
├── Break Time Management
│   ├── فترات الراحة المحددة
│   ├── تسجيل بداية/نهاية الراحة
│   ├── خصم من ساعات العمل
│   └── سياسات الراحة
├── Attendance Reports
│   ├── تقرير الحضور اليومي
│   ├── تقرير الحضور الشهري
│   ├── تقرير التأخيرات
│   ├── تقرير الغيابات
│   ├── تقرير الإضافي
│   └── تقرير شامل
├── Attendance Exceptions
│   ├── إدارة الاستثناءات
│   ├── طلب تصحيح حضور
│   ├── الموافقة على الاستثناءات
│   └── سجل الاستثناءات
└── Integration with Payroll
    ├── ربط تلقائي مع الرواتب
    ├── احتساب الخصومات
    ├── احتساب الإضافي
    └── أيام العمل الفعلية
```

---

### 📅 المرحلة 5: Recruitment & Talent (شهر 15-17)

#### Sprint 25-28: Recruitment Module
```
Week 49-52: ATS System
├── Job Posting Management
│   ├── إنشاء إعلان وظيفي
│   ├── تفاصيل الوظيفة
│   ├── المؤهلات المطلوبة
│   ├── نطاق الراتب
│   └── نشر الإعلان
├── Candidate Management
│   ├── قاعدة بيانات المرشحين
│   ├── السيرة الذاتية
│   ├── معلومات الاتصال
│   ├── المهارات والخبرات
│   └── تقييم المرشح
├── Application Tracking
│   ├── استقبال الطلبات
│   ├── فرز تلقائي
│   ├── مراحل التوظيف
│   ├── تتبع الحالة
│   └── الإشعارات
├── Resume Parsing (AI)
│   ├── استخراج البيانات من السيرة الذاتية
│   ├── ML للتصنيف
│   ├── تحليل المهارات
│   └── التطابق مع الوظيفة
├── Interview Scheduling
│   ├── جدولة المقابلات
│   ├── دعوات المقابلة
│   ├── تكامل مع التقويم
│   ├── تذكيرات
│   └── تسجيل نتائج المقابلة
└── Candidate Evaluation
    ├── نماذج التقييم
    ├── درجات المقابلة
    ├── ملاحظات المقابل
    ├── المقارنة بين المرشحين
    └── التوصيات

Week 53-56: Hiring Pipeline
├── Hiring Workflow Builder
│   ├── مراحل التوظيف المخصصة
│   ├── القواعد والشروط
│   ├── الموافقات المطلوبة
│   └── الانتقال التلقائي بين المراحل
├── Offer Management
│   ├── إنشاء عرض العمل
│   ├── تفاصيل الراتب والمزايا
│   ├── إرسال العرض
│   ├── تتبع الحالة
│   ├── قبول/رفض العرض
│   └── التفاوض
├── Onboarding Workflows
│   ├── قائمة مهام Onboarding
│   ├── المستندات المطلوبة
│   ├── إعداد الحسابات
│   ├── التدريب الأولي
│   └── متابعة الموظف الجديد
├── Integration with Job Boards
│   ├── LinkedIn Integration
│   ├── Indeed Integration
│   ├── Bayt.com
│   ├── Tanqeeb
│   └── منصات سعودية أخرى
├── Recruitment Analytics
│   ├── Time to Hire
│   ├── Cost per Hire
│   ├── مصادر المرشحين
│   ├── معدلات التحويل
│   └── KPIs التوظيف
└── Career Portal
    ├── صفحة الوظائف الشاغرة
    ├── التقديم أونلاين
    ├── تتبع الطلب
    ├── SEO Optimization
    └── Mobile Friendly
```

---

### 📅 المرحلة 6: Performance & Learning (شهر 18-20)

#### Sprint 29-32: Performance Management
```
Week 57-60: Performance System
├── Goal Setting (OKRs/KPIs)
│   ├── تحديد الأهداف
│   ├── OKRs (Objectives & Key Results)
│   ├── KPIs (Key Performance Indicators)
│   ├── ربط بأهداف الشركة
│   ├── تتبع التقدم
│   └── تحديث الأهداف
├── Performance Reviews
│   ├── دورات التقييم (ربع سنوي/سنوي)
│   ├── نماذج التقييم
│   ├── التقييم الذاتي
│   ├── تقييم المدير
│   ├── مراجعة المسؤول
│   └── النتيجة النهائية
├── 360-Degree Feedback
│   ├── تقييم من المدير
│   ├── تقييم من الزملاء
│   ├── تقييم من المرؤوسين
│   ├── التقييم الذاتي
│   └── ملخص شامل
├── Performance Rating System
│   ├── مقياس التقييم (1-5 أو A-E)
│   ├── المعايير
│   ├── الأوزان
│   ├── الحساب التلقائي
│   └── التصنيف
├── Performance Improvement Plans (PIP)
│   ├── تحديد نقاط التحسين
│   ├── خطة عمل
│   ├── جدول زمني
│   ├── متابعة دورية
│   └── تقييم النتائج
└── Performance Analytics
    ├── توزيع التقييمات
    ├── مقارنات بين الأقسام
    ├── الاتجاهات
    ├── High/Low Performers
    └── تقارير شاملة

Week 61-64: Learning Management
├── Course Management
│   ├── إنشاء دورات تدريبية
│   ├── محتوى الدورة (فيديو، PDF، اختبار)
│   ├── المدربين
│   ├── المدة الزمنية
│   └── الشهادة
├── Learning Paths
│   ├── مسارات تعليمية
│   ├── تسلسل الدورات
│   ├── المتطلبات السابقة
│   └── الشهادة النهائية
├── Training Assignments
│   ├── تعيين دورات للموظفين
│   ├── دورات إلزامية/اختيارية
│   ├── المواعيد النهائية
│   └── التذكيرات
├── Certifications Tracking
│   ├── سجل الشهادات
│   ├── الشهادات المهنية
│   ├── تواريخ الانتهاء
│   └── التجديد
├── Skills Matrix
│   ├── مصفوفة المهارات
│   ├── المهارات المطلوبة
│   ├── المهارات الحالية
│   ├── الفجوات
│   └── خطة التطوير
└── Learning Analytics
    ├── معدلات الإكمال
    ├── نتائج الاختبارات
    ├── الوقت المستغرق
    ├── المهارات المكتسبة
    └── ROI التدريب
```

---

### 📅 المرحلة 7: Expense & Travel (شهر 21-22)

#### Sprint 33-36: Spend Management
```
Week 65-68: Expense Management
├── Expense Submission
│   ├── نموذج طلب المصروف
│   ├── نوع المصروف
│   ├── المبلغ
│   ├── التاريخ
│   ├── الوصف
│   └── مركز التكلفة
├── Receipt Scanning (OCR)
│   ├── تصوير الإيصال
│   ├── استخراج البيانات بـ AI
│   ├── التحقق التلقائي
│   └── المرفقات
├── Expense Policies
│   ├── حدود المصروفات
│   ├── الفئات المسموحة
│   ├── قواعد الموافقة
│   └── الاستثناءات
├── Approval Workflows
│   ├── موافقات متعددة المستويات
│   ├── الموافقة التلقائية
│   ├── الرفض والأسباب
│   └── الإشعارات
├── Reimbursement Processing
│   ├── المطالبة بالتعويض
│   ├── المعالجة
│   ├── الدفع
│   └── التتبع
└── Expense Reports
    ├── تقرير المصروفات حسب الموظف
    ├── تقرير حسب القسم
    ├── تقرير حسب الفئة
    ├── تحليل الإنفاق
    └── مقارنات

Week 69-72: Travel Management
├── Travel Request System
│   ├── طلب سفر
│   ├── تفاصيل الرحلة
│   ├── التكلفة المتوقعة
│   ├── الموافقات
│   └── التأكيد
├── Travel Booking
│   ├── حجز الطيران
│   ├── حجز الفنادق
│   ├── حجز النقل
│   ├── التكامل مع وكالات السفر
│   └── إدارة الحجوزات
├── Per Diem Management
│   ├── بدل السفر اليومي
│   ├── المعدلات حسب المدينة
│   ├── الحساب التلقائي
│   └── الصرف
├── Travel Advances
│   ├── سلفة السفر
│   ├── الموافقة
│   ├── الصرف
│   ├── التسوية بعد العودة
│   └── الاسترداد
├── Travel Reports
│   ├── تقرير الرحلة
│   ├── المصروفات الفعلية
│   ├── المقارنة مع المتوقع
│   └── التحليلات
└── Card Management System
    ├── بطاقات الشركة
    ├── تعيين البطاقات
    ├── الحدود
    ├── المراقبة
    └── التقارير
```

---

### 📅 المرحلة 8: Analytics & Mobile (شهر 23-24)

#### Sprint 37-40: Advanced Features
```
Week 73-76: Analytics Dashboard
├── HR Analytics Dashboard
│   ├── KPIs رئيسية
│   ├── عدد الموظفين
│   ├── معدل الدوران (Turnover)
│   ├── معدل الغياب
│   ├── تكلفة الموظف
│   └── التركيبة السكانية
├── Custom Reports Builder
│   ├── منشئ التقارير المرئي
│   ├── اختيار الحقول
│   ├── الفلاتر
│   ├── التجميع
│   ├── الترتيب
│   └── حفظ القوالب
├── Data Visualization
│   ├── Charts & Graphs
│   ├── Dashboards تفاعلية
│   ├── Drill-down
│   ├── Export لـ Excel/PDF
│   └── Scheduling Reports
├── Predictive Analytics (AI)
│   ├── توقع الاستقالات
│   ├── توقع الأداء
│   ├── توصيات التدريب
│   └── تحليل الاتجاهات
├── Workforce Planning
│   ├── التخطيط للقوى العاملة
│   ├── التنبؤ بالاحتياجات
│   ├── تحليل الفجوات
│   └── خطط التوظيف
└── Salary Benchmarking
    ├── مقارنة الرواتب بالسوق
    ├── تحليل التنافسية
    ├── التوصيات
    └── التقارير

Week 77-80: Mobile App
├── Employee Mobile App (React Native)
│   ├── تسجيل الدخول
│   ├── لوحة الموظف
│   ├── الحضور والانصراف
│   ├── طلبات الإجازة
│   ├── كشوف الرواتب
│   ├── الطلبات والموافقات
│   └── الإشعارات
├── Manager Mobile App
│   ├── نظرة عامة على الفريق
│   ├── الموافقات السريعة
│   ├── التقارير
│   └── الإشعارات
├── Push Notifications
│   ├── FCM للأندرويد
│   ├── APNS لـ iOS
│   ├── إشعارات فورية
│   └── إدارة التفضيلات
├── Offline Mode Support
│   ├── تخزين محلي
│   ├── المزامنة التلقائية
│   └── قائمة الانتظار
├── Biometric Login
│   ├── بصمة الإصبع
│   ├── Face ID
│   └── Touch ID
└── App Store Deployment
    ├── Apple App Store
    ├── Google Play Store
    ├── CI/CD للموبايل
    └── التحديثات التلقائية

Week 81-84: Integration & Optimization
├── ERP Integrations
│   ├── SAP Integration
│   ├── Oracle Integration
│   ├── Microsoft Dynamics 365
│   └── Odoo
├── API Marketplace
│   ├── Public API Documentation
│   ├── API Keys Management
│   ├── Rate Limiting
│   └── Developer Portal
├── Webhook System
│   ├── إنشاء Webhooks
│   ├── Event Triggers
│   ├── Retry Logic
│   └── Logging
├── Performance Optimization
│   ├── Database Optimization
│   ├── Query Optimization
│   ├── Caching Strategy
│   ├── CDN Setup
│   └── Code Splitting
├── Security Audit
│   ├── Penetration Testing
│   ├── Vulnerability Scanning
│   ├── Code Review
│   ├── Security Patches
│   └── Compliance Check
└── Load Testing
    ├── Stress Testing
    ├── Performance Benchmarks
    ├── Scalability Testing
    └── Capacity Planning
```

---

## 🛠️ التقنيات المستخدمة (Stack الكامل)

### Frontend Stack
```yaml
Framework: Next.js 15 (App Router)
Language: TypeScript 5.9+
UI Library: React 19
UI Components: 
  - shadcn/ui (Radix UI)
  - Mantine (Theme B)
  - Tailwind CSS 4.x
  - Framer Motion (animations)
State Management:
  - Zustand (client state)
  - TanStack Query v5 (server state)
Forms: React Hook Form + Zod
Tables: TanStack Table v8
Charts: Recharts + Chart.js
Internationalization: next-intl (AR/EN)
Fonts:
  - Cairo (Arabic)
  - Almarai (Arabic)
  - IBM Plex Sans Arabic
  - Inter (English)
Testing:
  - Vitest + Testing Library
  - Playwright (E2E)
  - Storybook
```

### Backend Stack
```yaml
Framework: NestJS 10
Language: TypeScript 5.9+
Architecture: 
  - Microservices
  - Domain-Driven Design (DDD)
  - CQRS + Event Sourcing
API Gateway: NestJS + Kong/Nginx
Authentication:
  - JWT (access + refresh tokens)
  - OAuth 2.0
  - 2FA (TOTP)
Authorization: RBAC + ABAC
Validation: class-validator + class-transformer
Documentation: Swagger/OpenAPI 3.0
Testing:
  - Jest
  - Supertest
  - Test Containers
```

### Database Stack
```yaml
Primary Database: PostgreSQL 16+
ORM: Prisma 6+
Migrations: Prisma Migrate
Caching: Redis 7+ (Cache + Session + Jobs via BullMQ)
Search Engine: ElasticSearch 8+ (optional لاحقًا)
Document Store: (اختياري لاحقًا) — لا نجبر MongoDB في البداية
Async Processing:
  - BullMQ (Render-friendly)
  - RabbitMQ/Kafka (مرحلة توسع لاحقًا عند الحاجة)
```

### Infrastructure & DevOps
```yaml
Containerization: Docker + Docker Compose
Hosting Target: Render.com (Production)
Orchestration: Kubernetes (اختياري لاحقًا عند الانتقال لـAWS/EKS)
CI/CD:
  - GitHub Actions
  - GitLab CI
  - ArgoCD (GitOps)
Cloud Providers:
  - Render (Primary)
  - Cloudflare (CDN + R2 Storage)
Monitoring:
  - Sentry (Error Tracking) (أولاً)
  - Render Logs (أولاً)
  - Prometheus + Grafana / ELK / Jaeger (اختياري لاحقًا)
API Management: Kong Gateway
Load Balancer: Nginx / Traefik
Storage:
  - Cloudflare R2 (S3-compatible)
  - MinIO (Local Dev)
Backups:
  - Automated Daily Backups
  - Point-in-time Recovery
Security:
  - SSL/TLS Certificates (Let's Encrypt)
  - WAF (Web Application Firewall)
  - DDoS Protection
  - Vault (Secrets Management)
```

### Mobile Stack
```yaml
Framework: React Native 0.73+
Language: TypeScript
Navigation: React Navigation
State: Zustand + TanStack Query
UI: React Native Paper + Custom Components
Storage: MMKV (Fast Key-Value)
Push Notifications: 
  - FCM (Firebase Cloud Messaging)
  - APNS (Apple Push Notification Service)
Testing: Jest + Detox
Build: EAS (Expo Application Services)
```

### Development Tools
```yaml
Monorepo: Turborepo 2.3+
Package Manager: pnpm 9+
Code Quality:
  - ESLint 9+
  - Prettier
  - Husky (Git Hooks)
  - lint-staged
  - commitlint
Version Control: Git + GitHub/GitLab
IDE: VS Code (Recommended)
API Testing:
  - Postman
  - Insomnia
  - Bruno
Database Tools:
  - Prisma Studio
  - DBeaver
  - pgAdmin
```

---

## 📊 Database Schema الكامل (Prisma)

### Schema: Auth & Users
```prisma
// prisma/schemas/auth.prisma

model User {
  id                String      @id @default(uuid())
  email             String      @unique
  phone             String?     @unique
  username          String?     @unique
  password          String
  emailVerified     DateTime?
  phoneVerified     DateTime?
  twoFactorEnabled  Boolean     @default(false)
  twoFactorSecret   String?
  avatar            String?
  status            UserStatus  @default(ACTIVE)
  lastLoginAt       DateTime?
  passwordChangedAt DateTime?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  deletedAt         DateTime?   @db.Timestamp()
  
  // Relations
  employee          Employee?
  roles             UserRole[]
  permissions       UserPermission[]
  sessions          Session[]
  refreshTokens     RefreshToken[]
  loginHistory      LoginHistory[]
  
  @@map("users")
}

model Role {
  id          String       @id @default(uuid())
  name        String       @unique
  displayName String
  description String?
  tenantId    String?
  isSystem    Boolean      @default(false)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  // Relations
  users       UserRole[]
  permissions RolePermission[]
  tenant      Tenant?      @relation(fields: [tenantId], references: [id])
  
  @@map("roles")
}

model Permission {
  id          String           @id @default(uuid())
  resource    String
  action      String           // CREATE, READ, UPDATE, DELETE, APPROVE, etc.
  description String?
  
  // Relations
  roles       RolePermission[]
  users       UserPermission[]
  
  @@unique([resource, action])
  @@map("permissions")
}

model UserRole {
  userId    String
  roleId    String
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  @@id([userId, roleId])
  @@map("user_roles")
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  ipAddress String?
  userAgent String?
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("sessions")
}
```

### Schema: Tenants (Multi-tenancy)
```prisma
// prisma/schemas/tenant.prisma

model Tenant {
  id                  String       @id @default(uuid())
  name                String
  slug                String       @unique
  domain              String?      @unique
  logo                String?
  industry            String?
  size                CompanySize?
  country             String       @default("SA")
  timezone            String       @default("Asia/Riyadh")
  currency            String       @default("SAR")
  language            String       @default("ar")
  theme               TenantTheme  @default(SHADCN)
  
  // Settings
  settings            Json?
  
  // Saudi-specific
  commercialRegister  String?      @unique
  taxNumber           String?
  gosiNumber          String?
  
  // Status
  status              TenantStatus @default(ACTIVE)
  subscriptionId      String?
  
  // Timestamps
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
  deletedAt           DateTime?
  
  // Relations
  employees           Employee[]
  departments         Department[]
  locations           Location[]
  roles               Role[]
  
  @@map("tenants")
}

enum TenantStatus {
  ACTIVE
  SUSPENDED
  CANCELLED
}

enum TenantTheme {
  SHADCN
  MANTINE
}

enum CompanySize {
  SMALL       // 1-50
  MEDIUM      // 51-200
  LARGE       // 201-1000
  ENTERPRISE  // 1000+
}
```

### Schema: Employees & Organization
```prisma
// prisma/schemas/employee.prisma

model Employee {
  id                String          @id @default(uuid())
  employeeNumber    String          @unique
  tenantId          String
  userId            String?         @unique
  
  // Personal Info
  firstName         String
  middleName        String?
  lastName          String
  firstNameAr       String?
  lastNameAr        String?
  gender            Gender
  dateOfBirth       DateTime?
  nationality       String
  maritalStatus     MaritalStatus?
  religion          String?
  
  // Contact Info
  email             String?
  personalEmail     String?
  phone             String?
  emergencyContact  Json?           // {name, phone, relation}
  
  // Address
  address           Json?
  
  // Documents (Saudi-specific)
  nationalId        String?
  iqamaNumber       String?
  iqamaExpiryDate   DateTime?
  passportNumber    String?
  passportExpiryDate DateTime?
  sponsorshipType   SponsorshipType?
  
  // Employment Info
  departmentId      String?
  jobTitleId        String?
  managerId         String?
  locationId        String?
  costCenterId      String?
  
  // Employment Status
  employmentType    EmploymentType
  contractType      ContractType
  status            EmployeeStatus  @default(ACTIVE)
  
  // Dates
  hireDate          DateTime
  contractStartDate DateTime?
  contractEndDate   DateTime?
  probationEndDate  DateTime?
  terminationDate   DateTime?
  
  // Work Schedule
  workScheduleId    String?
  shiftId           String?
  
  // Timestamps
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  deletedAt         DateTime?
  
  // Relations
  tenant            Tenant          @relation(fields: [tenantId], references: [id])
  user              User?           @relation(fields: [userId], references: [id])
  department        Department?     @relation(fields: [departmentId], references: [id])
  jobTitle          JobTitle?       @relation(fields: [jobTitleId], references: [id])
  manager           Employee?       @relation("ManagerSubordinates", fields: [managerId], references: [id])
  subordinates      Employee[]      @relation("ManagerSubordinates")
  location          Location?       @relation(fields: [locationId], references: [id])
  costCenter        CostCenter?     @relation(fields: [costCenterId], references: [id])
  
  // Related Data
  salaries          Salary[]
  attendances       Attendance[]
  leaves            Leave[]
  documents         Document[]
  performanceReviews PerformanceReview[]
  loans             Loan[]
  expenses          Expense[]
  
  @@map("employees")
}

model Department {
  id          String       @id @default(uuid())
  tenantId    String
  name        String
  nameAr      String?
  code        String?
  parentId    String?
  managerId   String?
  description String?
  isActive    Boolean      @default(true)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  // Relations
  tenant      Tenant       @relation(fields: [tenantId], references: [id])
  parent      Department?  @relation("DepartmentHierarchy", fields: [parentId], references: [id])
  children    Department[] @relation("DepartmentHierarchy")
  employees   Employee[]
  
  @@unique([tenantId, code])
  @@map("departments")
}

model JobTitle {
  id          String     @id @default(uuid())
  tenantId    String
  name        String
  nameAr      String?
  code        String?
  level       Int?
  description String?
  minSalary   Decimal?   @db.Decimal(10, 2)
  maxSalary   Decimal?   @db.Decimal(10, 2)
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  // Relations
  employees   Employee[]
  
  @@unique([tenantId, code])
  @@map("job_titles")
}

model Location {
  id          String     @id @default(uuid())
  tenantId    String
  name        String
  nameAr      String?
  code        String?
  type        LocationType
  address     Json?
  latitude    Float?
  longitude   Float?
  radius      Int?       // meters for GPS check-in
  timezone    String     @default("Asia/Riyadh")
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  // Relations
  tenant      Tenant     @relation(fields: [tenantId], references: [id])
  employees   Employee[]
  
  @@unique([tenantId, code])
  @@map("locations")
}

model CostCenter {
  id          String     @id @default(uuid())
  tenantId    String
  name        String
  code        String
  description String?
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  // Relations
  employees   Employee[]
  
  @@unique([tenantId, code])
  @@map("cost_centers")
}

enum Gender {
  MALE
  FEMALE
}

enum MaritalStatus {
  SINGLE
  MARRIED
  DIVORCED
  WIDOWED
}

enum SponsorshipType {
  COMPANY_SPONSORED
  INDIVIDUAL_SPONSORED
  TRANSFER_SPONSORED
}

enum EmploymentType {
  FULL_TIME
  PART_TIME
  CONTRACT
  INTERN
  TEMPORARY
}

enum ContractType {
  PERMANENT
  FIXED_TERM
  PROBATION
  SEASONAL
}

enum EmployeeStatus {
  ACTIVE
  ON_LEAVE
  SUSPENDED
  TERMINATED
  RESIGNED
}

enum LocationType {
  HEADQUARTERS
  BRANCH
  WAREHOUSE
  REMOTE
}
```

### Schema: Payroll & Salary
```prisma
// prisma/schemas/payroll.prisma

model Salary {
  id                String       @id @default(uuid())
  employeeId        String
  basicSalary       Decimal      @db.Decimal(10, 2)
  currency          String       @default("SAR")
  
  // Allowances
  housingAllowance  Decimal?     @db.Decimal(10, 2)
  transportAllowance Decimal?    @db.Decimal(10, 2)
  foodAllowance     Decimal?     @db.Decimal(10, 2)
  otherAllowances   Json?        // [{name, amount, type}]
  
  // Deductions
  gosiEmployee      Decimal?     @db.Decimal(10, 2)
  insurance         Decimal?     @db.Decimal(10, 2)
  otherDeductions   Json?
  
  // Dates
  effectiveDate     DateTime
  endDate           DateTime?
  
  // Status
  isActive          Boolean      @default(true)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  
  // Relations
  employee          Employee     @relation(fields: [employeeId], references: [id])
  payrollRuns       PayrollItem[]
  
  @@map("salaries")
}

model PayrollRun {
  id              String          @id @default(uuid())
  tenantId        String
  name            String
  month           Int
  year            Int
  periodStart     DateTime
  periodEnd       DateTime
  paymentDate     DateTime?
  
  // Totals
  totalBasicSalary    Decimal     @db.Decimal(12, 2)
  totalAllowances     Decimal     @db.Decimal(12, 2)
  totalDeductions     Decimal     @db.Decimal(12, 2)
  totalNetPay         Decimal     @db.Decimal(12, 2)
  totalGosiEmployer   Decimal     @db.Decimal(12, 2)
  
  // Status
  status          PayrollStatus   @default(DRAFT)
  
  // Approval
  approvedBy      String?
  approvedAt      DateTime?
  
  // Processing
  processedAt     DateTime?
  
  // Timestamps
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  // Relations
  items           PayrollItem[]
  
  @@unique([tenantId, month, year])
  @@map("payroll_runs")
}

model PayrollItem {
  id              String      @id @default(uuid())
  payrollRunId    String
  employeeId      String
  salaryId        String
  
  // Calculation
  workingDays     Int
  actualDays      Int
  basicSalary     Decimal     @db.Decimal(10, 2)
  
  // Allowances
  allowances      Json?       // [{name, amount}]
  totalAllowances Decimal     @db.Decimal(10, 2)
  
  // Additional Earnings
  overtime        Decimal?    @db.Decimal(10, 2)
  bonus           Decimal?    @db.Decimal(10, 2)
  commission      Decimal?    @db.Decimal(10, 2)
  
  // Deductions
  deductions      Json?
  totalDeductions Decimal     @db.Decimal(10, 2)
  absenceDeduction Decimal?   @db.Decimal(10, 2)
  loanDeduction   Decimal?    @db.Decimal(10, 2)
  
  // GOSI
  gosiEmployee    Decimal     @db.Decimal(10, 2)
  gosiEmployer    Decimal     @db.Decimal(10, 2)
  
  // Totals
  grossPay        Decimal     @db.Decimal(10, 2)
  netPay          Decimal     @db.Decimal(10, 2)
  
  // Payment
  bankName        String?
  accountNumber   String?
  iban            String?
  
  // Status
  status          PayrollItemStatus @default(PENDING)
  
  // Timestamps
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relations
  payrollRun      PayrollRun  @relation(fields: [payrollRunId], references: [id])
  employee        Employee    @relation(fields: [employeeId], references: [id])
  salary          Salary      @relation(fields: [salaryId], references: [id])
  
  @@map("payroll_items")
}

model Loan {
  id              String       @id @default(uuid())
  employeeId      String
  amount          Decimal      @db.Decimal(10, 2)
  installments    Int
  monthlyDeduction Decimal     @db.Decimal(10, 2)
  
  // Progress
  paidInstallments Int         @default(0)
  remainingAmount Decimal      @db.Decimal(10, 2)
  
  // Dates
  startDate       DateTime
  endDate         DateTime
  
  // Status
  status          LoanStatus   @default(PENDING)
  
  // Approval
  approvedBy      String?
  approvedAt      DateTime?
  
  // Timestamps
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  // Relations
  employee        Employee     @relation(fields: [employeeId], references: [id])
  
  @@map("loans")
}

enum PayrollStatus {
  DRAFT
  SUBMITTED
  APPROVED
  PROCESSING
  COMPLETED
  CANCELLED
}

enum PayrollItemStatus {
  PENDING
  PAID
  FAILED
  ON_HOLD
}

enum LoanStatus {
  PENDING
  APPROVED
  ACTIVE
  COMPLETED
  CANCELLED
}
```

### Schema: Attendance & Time
```prisma
// prisma/schemas/attendance.prisma

model Attendance {
  id              String           @id @default(uuid())
  employeeId      String
  date            DateTime         @db.Date
  shiftId         String?
  
  // Check-in/out
  checkIn         DateTime?
  checkOut        DateTime?
  checkInLocation Json?            // {lat, lng, address}
  checkOutLocation Json?
  
  // Working Hours
  scheduledHours  Decimal          @db.Decimal(5, 2)
  actualHours     Decimal?         @db.Decimal(5, 2)
  overtimeHours   Decimal?         @db.Decimal(5, 2)
  breakHours      Decimal?         @db.Decimal(5, 2)
  
  // Status
  status          AttendanceStatus @default(PRESENT)
  isLateCheckIn   Boolean          @default(false)
  lateMinutes     Int?
  isEarlyCheckOut Boolean          @default(false)
  earlyMinutes    Int?
  
  // Notes
  notes           String?
  
  // Timestamps
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  // Relations
  employee        Employee         @relation(fields: [employeeId], references: [id])
  shift           Shift?           @relation(fields: [shiftId], references: [id])
  
  @@unique([employeeId, date])
  @@map("attendances")
}

model Shift {
  id          String       @id @default(uuid())
  tenantId    String
  name        String
  nameAr      String?
  code        String?
  
  // Timing
  startTime   String       // "09:00"
  endTime     String       // "17:00"
  
  // Break
  breakStart  String?
  breakEnd    String?
  
  // Grace Period
  lateGrace   Int          @default(15) // minutes
  earlyGrace  Int          @default(15)
  
  // Days
  workDays    Json         // [1,2,3,4,5] (Monday-Friday)
  
  // Settings
  isActive    Boolean      @default(true)
  color       String?
  
  // Timestamps
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  // Relations
  attendances Attendance[]
  
  @@map("shifts")
}

model WorkSchedule {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  description String?
  hoursPerDay Decimal  @db.Decimal(4, 2)
  hoursPerWeek Decimal @db.Decimal(5, 2)
  workDays    Json     // [{day: 1, hours: 8, shiftId: ""}]
  isDefault   Boolean  @default(false)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("work_schedules")
}

model Holiday {
  id          String       @id @default(uuid())
  tenantId    String
  name        String
  nameAr      String?
  date        DateTime     @db.Date
  type        HolidayType
  isRecurring Boolean      @default(false)
  locationIds Json?        // Specific locations
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  @@map("holidays")
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  HALF_DAY
  ON_LEAVE
  OFF_DAY
  HOLIDAY
  WEEKEND
}

enum HolidayType {
  PUBLIC
  NATIONAL
  RELIGIOUS
  COMPANY
}
```

### Schema: Leave Management
```prisma
// prisma/schemas/leave.prisma

model LeaveType {
  id              String   @id @default(uuid())
  tenantId        String
  name            String
  nameAr          String?
  code            String
  
  // Limits
  maxDaysPerYear  Int
  maxConsecutiveDays Int?
  
  // Accrual
  accrualRate     Decimal? @db.Decimal(5, 2) // days per month
  
  // Rules
  isPaid          Boolean  @default(true)
  requiresApproval Boolean @default(true)
  canCarryForward Boolean  @default(false)
  canEncash       Boolean  @default(false)
  
  // Gender-specific
  applicableGender Gender?
  
  // Document Required
  requiresDocument Boolean  @default(false)
  
  // Settings
  isActive        Boolean  @default(true)
  color           String?
  icon            String?
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  leaves          Leave[]
  balances        LeaveBalance[]
  
  @@unique([tenantId, code])
  @@map("leave_types")
}

model Leave {
  id              String       @id @default(uuid())
  employeeId      String
  leaveTypeId     String
  
  // Dates
  startDate       DateTime     @db.Date
  endDate         DateTime     @db.Date
  totalDays       Int
  
  // Details
  reason          String?
  notes           String?
  attachment      String?
  
  // Status
  status          LeaveStatus  @default(PENDING)
  
  // Approval Flow
  currentApproverId String?
  approvalChain   Json?        // [{userId, order, status, comment}]
  
  // Timestamps
  appliedAt       DateTime     @default(now())
  reviewedAt      DateTime?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  // Relations
  employee        Employee     @relation(fields: [employeeId], references: [id])
  leaveType       LeaveType    @relation(fields: [leaveTypeId], references: [id])
  
  @@map("leaves")
}

model LeaveBalance {
  id              String    @id @default(uuid())
  employeeId      String
  leaveTypeId     String
  year            Int
  
  // Balance
  entitled        Decimal   @db.Decimal(5, 2)
  used            Decimal   @db.Decimal(5, 2) @default(0)
  remaining       Decimal   @db.Decimal(5, 2)
  carriedForward  Decimal   @db.Decimal(5, 2) @default(0)
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  leaveType       LeaveType @relation(fields: [leaveTypeId], references: [id])
  
  @@unique([employeeId, leaveTypeId, year])
  @@map("leave_balances")
}

enum LeaveStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
```

### Schema: Documents & Files
```prisma
// prisma/schemas/document.prisma

model Document {
  id              String         @id @default(uuid())
  employeeId      String?
  tenantId        String
  
  // Document Info
  name            String
  type            DocumentType
  category        String?
  
  // File
  filename        String
  filepath        String
  mimeType        String
  size            Int            // bytes
  
  // Metadata
  issueDate       DateTime?      @db.Date
  expiryDate      DateTime?      @db.Date
  documentNumber  String?
  
  // Status
  status          DocumentStatus @default(ACTIVE)
  
  // Upload Info
  uploadedBy      String
  uploadedAt      DateTime       @default(now())
  
  // Timestamps
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  // Relations
  employee        Employee?      @relation(fields: [employeeId], references: [id])
  
  @@map("documents")
}

enum DocumentType {
  NATIONAL_ID
  IQAMA
  PASSPORT
  CONTRACT
  CERTIFICATE
  LETTER
  INSURANCE
  VISA
  MEDICAL
  OTHER
}

enum DocumentStatus {
  ACTIVE
  EXPIRED
  ARCHIVED
  DELETED
}
```

### Schema: Expense & Travel
```prisma
// prisma/schemas/expense.prisma

model Expense {
  id              String         @id @default(uuid())
  employeeId      String
  categoryId      String
  
  // Details
  title           String
  description     String?
  amount          Decimal        @db.Decimal(10, 2)
  currency        String         @default("SAR")
  expenseDate     DateTime       @db.Date
  
  // Receipt
  receipt         String?        // File path
  
  // Status
  status          ExpenseStatus  @default(PENDING)
  
  // Approval
  approvedBy      String?
  approvedAt      DateTime?
  rejectionReason String?
  
  // Payment
  reimbursedAt    DateTime?
  
  // Timestamps
  submittedAt     DateTime       @default(now())
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  // Relations
  employee        Employee       @relation(fields: [employeeId], references: [id])
  category        ExpenseCategory @relation(fields: [categoryId], references: [id])
  
  @@map("expenses")
}

model ExpenseCategory {
  id          String    @id @default(uuid())
  tenantId    String
  name        String
  nameAr      String?
  code        String
  maxAmount   Decimal?  @db.Decimal(10, 2)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Relations
  expenses    Expense[]
  
  @@unique([tenantId, code])
  @@map("expense_categories")
}

enum ExpenseStatus {
  DRAFT
  PENDING
  APPROVED
  REJECTED
  REIMBURSED
}
```

---

## 🏗️ Domain-Driven Design Architecture

### بنية DDD الكاملة

```
domains/
├── hr-domain/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── employee.entity.ts
│   │   │   ├── department.entity.ts
│   │   │   └── job-title.entity.ts
│   │   ├── value-objects/
│   │   │   ├── employee-number.vo.ts
│   │   │   ├── salary.vo.ts
│   │   │   └── address.vo.ts
│   │   ├── aggregates/
│   │   │   └── employee.aggregate.ts
│   │   ├── events/
│   │   │   ├── employee-created.event.ts
│   │   │   ├── employee-updated.event.ts
│   │   │   └── employee-terminated.event.ts
│   │   ├── repositories/
│   │   │   └── employee.repository.interface.ts
│   │   └── services/
│   │       └── employee-domain.service.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── create-employee/
│   │   │   │   ├── create-employee.command.ts
│   │   │   │   ├── create-employee.handler.ts
│   │   │   │   └── create-employee.dto.ts
│   │   │   ├── update-employee/
│   │   │   └── terminate-employee/
│   │   ├── queries/
│   │   │   ├── get-employee/
│   │   │   ├── get-employees/
│   │   │   └── get-employee-by-number/
│   │   ├── services/
│   │   │   └── employee.service.ts
│   │   └── dto/
│   │       ├── employee.dto.ts
│   │       └── create-employee.dto.ts
│   ├── infrastructure/
│   │   ├── repositories/
│   │   │   └── employee.repository.ts
│   │   ├── persistence/
│   │   │   └── employee.schema.ts
│   │   └── adapters/
│   │       └── employee.mapper.ts
│   └── presentation/
│       └── controllers/
│           └── employee.controller.ts

├── payroll-domain/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── payroll-run.entity.ts
│   │   │   ├── payroll-item.entity.ts
│   │   │   └── salary.entity.ts
│   │   ├── value-objects/
│   │   │   ├── money.vo.ts
│   │   │   ├── gosi-calculation.vo.ts
│   │   │   └── working-days.vo.ts
│   │   ├── services/
│   │   │   ├── salary-calculator.service.ts
│   │   │   ├── gosi-calculator.service.ts
│   │   │   └── wps-generator.service.ts
│   │   └── events/
│   │       ├── payroll-run-created.event.ts
│   │       ├── payroll-approved.event.ts
│   │       └── payroll-completed.event.ts
│   └── ... (same structure)

├── attendance-domain/
├── leave-domain/
├── recruitment-domain/
├── performance-domain/
├── learning-domain/
└── compliance-domain/
```

---

## 🔐 Authentication & Authorization

### Multi-Factor Authentication Flow
```typescript
// JWT + Refresh Token + 2FA Strategy

// 1. Login Request
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "********",
  "tenantId": "uuid"
}

// 2. Response (if 2FA enabled)
{
  "requiresTwoFactor": true,
  "tempToken": "temp_token_here"
}

// 3. Verify 2FA
POST /api/auth/verify-2fa
{
  "tempToken": "temp_token_here",
  "code": "123456"
}

// 4. Final Response
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "refresh_token_here",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "roles": ["ADMIN"],
    "permissions": ["employee:read", "employee:write"]
  }
}
```

### Permission System (RBAC + ABAC)
```typescript
// Resource-based Permissions
permissions = {
  // Format: "resource:action"
  "employee:create",
  "employee:read",
  "employee:update",
  "employee:delete",
  "employee:approve",
  
  "payroll:create",
  "payroll:read",
  "payroll:approve",
  "payroll:process",
  
  "leave:create",
  "leave:approve",
  "leave:reject",
  
  // ... more permissions
}

// Permission Guard Example
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('employee:create')
@Post('employees')
async createEmployee(@Body() dto: CreateEmployeeDto) {
  return this.employeeService.create(dto);
}

// Attribute-based (ABAC) Example
@UseGuards(JwtAuthGuard, AbacGuard)
@CheckPolicies((ability: AppAbility) => 
  ability.can('read', 'Employee', { departmentId: user.departmentId })
)
@Get('employees/:id')
async getEmployee(@Param('id') id: string) {
  return this.employeeService.findOne(id);
}
```

---

## 🌐 API Gateway & Microservices Communication

### API Gateway Routes
```yaml
# Kong Gateway Configuration
routes:
  - name: auth-service
    paths: ["/api/v1/auth"]
    service: auth-service
    plugins:
      - name: rate-limiting
      - name: cors
      
  - name: hr-service
    paths: ["/api/v1/hr", "/api/v1/employees", "/api/v1/departments"]
    service: hr-service
    plugins:
      - name: jwt
      - name: rate-limiting
      - name: request-transformer
      
  - name: payroll-service
    paths: ["/api/v1/payroll", "/api/v1/salaries"]
    service: payroll-service
    plugins:
      - name: jwt
      - name: rate-limiting
      
  # ... more services
```

### Event-Driven Architecture
```typescript
// RabbitMQ Event Bus

// Employee Created Event
{
  eventType: "employee.created",
  aggregate: "Employee",
  aggregateId: "employee-uuid",
  version: 1,
  timestamp: "2026-01-24T10:00:00Z",
  data: {
    employeeId: "uuid",
    employeeNumber: "EMP001",
    firstName: "Ahmed",
    lastName: "Ali",
    email: "ahmed@company.com",
    departmentId: "dept-uuid",
    hireDate: "2026-01-24"
  },
  metadata: {
    userId: "user-uuid",
    tenantId: "tenant-uuid",
    correlationId: "corr-uuid"
  }
}

// Services Listening:
// 1. payroll-service → Create salary record
// 2. attendance-service → Setup attendance profile
// 3. notification-service → Send welcome email
// 4. analytics-service → Update headcount metrics
```

---

## 📱 Multi-tenancy Strategy

### Database-per-Tenant (Isolated)
```typescript
// Connection Pool Manager
export class TenantConnectionManager {
  private connections: Map<string, PrismaClient> = new Map();
  
  async getConnection(tenantId: string): Promise<PrismaClient> {
    if (!this.connections.has(tenantId)) {
      const tenant = await this.getTenantConfig(tenantId);
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: tenant.databaseUrl
          }
        }
      });
      this.connections.set(tenantId, prisma);
    }
    return this.connections.get(tenantId)!;
  }
}

// Tenant Middleware
export function tenantMiddleware(): MiddlewareHandler {
  return async (req, res, next) => {
    // Extract tenant from subdomain or header
    const tenant = req.headers['x-tenant-id'] || 
                   extractFromSubdomain(req.hostname);
    
    if (!tenant) {
      return res.status(400).json({ error: 'Tenant not specified' });
    }
    
    req.tenantId = tenant;
    next();
  };
}
```

---

## 🚀 Deployment & DevOps

### Docker Compose (Development)
```yaml
version: '3.8'

services:
  # Databases
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ujoors
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
  
  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin
  
  # Services
  api-gateway:
    build: ./services/api-gateway
    ports:
      - "3000:3000"
    depends_on:
      - redis
      - rabbitmq
    environment:
      NODE_ENV: development
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://admin:admin@rabbitmq:5672
  
  auth-service:
    build: ./services/auth-service
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/ujoors
  
  hr-service:
    build: ./services/hr-service
    ports:
      - "3002:3002"
  
  # Frontend
  web-admin:
    build: ./apps/web-admin
    ports:
      - "4000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://api-gateway:3000
  
volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Deployment
```yaml
# kubernetes/deployments/hr-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hr-service
  namespace: ujoors
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hr-service
  template:
    metadata:
      labels:
        app: hr-service
    spec:
      containers:
      - name: hr-service
        image: ujoors/hr-service:latest
        ports:
        - containerPort: 3002
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: REDIS_URL
          value: redis://redis-service:6379
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3002
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3002
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: hr-service
  namespace: ujoors
spec:
  selector:
    app: hr-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3002
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: hr-service-hpa
  namespace: ujoors
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: hr-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## 💰 تقدير التكاليف (Estimated Costs)

### Development Team (24 Months)
```
Team Structure:
├── 1 Technical Lead / Solution Architect: $8,000/month × 24 = $192,000
├── 3 Senior Full-stack Developers: $6,000/month × 3 × 24 = $432,000
├── 2 Backend Developers (NestJS): $5,000/month × 2 × 24 = $240,000
├── 2 Frontend Developers (Next.js/React): $5,000/month × 2 × 24 = $240,000
├── 1 Mobile Developer (React Native): $5,500/month × 24 = $132,000
├── 1 DevOps Engineer: $6,000/month × 24 = $144,000
├── 1 QA Engineer: $4,000/month × 24 = $96,000
├── 1 UI/UX Designer: $4,500/month × 24 = $108,000
└── 1 Product Manager: $6,000/month × 24 = $144,000
                                Total: $1,728,000
```

### Infrastructure (Monthly for Production)
```
AWS Services:
├── EC2 Instances (5× t3.large): $350/month
├── RDS PostgreSQL (db.r5.xlarge): $500/month
├── ElastiCache Redis (cache.r5.large): $200/month
├── S3 Storage (5TB): $115/month
├── CloudFront CDN: $150/month
├── Load Balancer: $30/month
├── ECS/EKS: $150/month
└── Monitoring & Logs: $100/month
                    Subtotal: $1,595/month

Additional:
├── Domain & SSL: $50/month
├── Email Service (SendGrid): $100/month
├── SMS Service (Twilio): $200/month
├── Backup & DR: $200/month
└── Security & Compliance: $150/month
                    Subtotal: $700/month

Monthly Infrastructure Total: $2,295/month
Annual Infrastructure: $27,540/year
```

### Third-party Services (Annual)
```
├── GitHub Enterprise: $21/user/month × 12 × $2,520
├── Monitoring (Datadog/New Relic): $300/month = $3,600/year
├── Error Tracking (Sentry): $100/month = $1,200/year
├── Analytics (Mixpanel): $200/month = $2,400/year
├── CI/CD (GitHub Actions): $50/month = $600/year
└── Security Scanning: $150/month = $1,800/year
                            Total: $12,120/year
```

### Grand Total
```
Development Team (24 months): $1,728,000
Infrastructure (24 months): $55,080
Third-party Services (24 months): $24,240
Contingency (15%): $271,098
                    
TOTAL PROJECT COST: $2,078,418 (~$2.1M)
```

---

## 📊 تقارير النجاح (Success Metrics & KPIs)

```yaml
Technical KPIs:
  - API Response Time: < 200ms (P95)
  - System Uptime: 99.9%
  - Error Rate: < 0.1%
  - Code Coverage: > 80%
  - Build Time: < 5 minutes
  - Deployment Frequency: Daily

Business KPIs:
  - Time to Hire: < 30 days
  - Employee Satisfaction: > 4.5/5
  - Payroll Accuracy: 99.99%
  - Leave Approval Time: < 24 hours
  - Onboarding Time: < 3 days
  
User Adoption:
  - Monthly Active Users: Track growth
  - Feature Adoption Rate: > 70%
  - Mobile App Downloads: Track
  - Support Tickets: < 5% of users/month
```

---

## ✅ الخلاصة والخطوات التالية

### ما تم إنجازه
✅ بنية Monorepo كاملة بـ Turborepo  
✅ معمارية DDD شاملة لـ 8 Domains  
✅ 13 Microservice مفصّلة  
✅ 5 تطبيقات Frontend  
✅ Database Schema كامل (Prisma)  
✅ خطة 24 شهر مفصّلة  
✅ تكامل Saudi Compliance  
✅ Authentication & Authorization  
✅ Event-Driven Architecture  
✅ Multi-tenancy Strategy  
✅ DevOps & Infrastructure  

### الخطوات التالية الفورية

1. **إنشاء البنية الأساسية**
   ```bash
   # Initialize Turborepo
   npx create-turbo@latest
   
   # Setup Prisma
   pnpm add -D prisma @prisma/client
   prisma init
   
   # Create folder structure
   mkdir -p apps/{web-admin,web-employee,web-manager,mobile-app,landing-page}
   mkdir -p services/{api-gateway,auth-service,hr-service,payroll-service}
   mkdir -p domains/{hr,payroll,attendance,leave}
   mkdir -p packages/{ui,config,types,utils,api-client}
   ```

2. **Setup Development Environment**
   ```bash
   # Docker Compose
   docker-compose up -d postgres redis rabbitmq
   
   # Run migrations
   prisma migrate dev --name init
   
   # Generate Prisma Client
   prisma generate
   ```

3. **بدء التطوير من Sprint 1**
   - Week 1-2: Project Setup + Git + CI/CD
   - Week 3-4: Core Infrastructure + Auth
   - Week 5-6: UI Foundation
   - Week 7-8: First Employee CRUD

---

## 📞 الدعم والمتابعة

هذه الخطة الشاملة جاهزة للتنفيذ الفوري! 🚀

**هل تريد البدء في إنشاء الملفات الفعلية؟**

### المرحلة 1: الأساسيات (أسبوع 1-2)
```
Week 1-2: البنية التحتية
├── ✅ Prisma Schema الكامل
├── ✅ Next.js Setup with shadcn/ui  
├── ✅ Database Setup (PostgreSQL)
├── ✅ Authentication System
└── ✅ Arabic/English i18n
```

### المرحلة 2: إدارة الموظفين (أسبوع 3-4)
```
Week 3-4: Employees Module
├── قائمة الموظفين مع DataTable
├── إضافة/تعديل موظف
├── الملف الشخصي الكامل
├── المستندات
├── السجل الوظيفي
└── Org Chart
```

### المرحلة 3: الأقسام والهيكل التنظيمي (أسبوع 5)
```
Week 5: Departments & Organization
├── إدارة الأقسام
├── المسميات الوظيفية
├── مراكز التكلفة
└── الهيكل التنظيمي
```

### المرحلة 4: الحضور والانصراف (أسبوع 6-7)
```
Week 6-7: Attendance & Time Tracking
├── Check-in/Check-out System
├── إدارة الورديات
├── تتبع ساعات العمل
├── الإجازات والغيابات
├── Overtime Calculation
└── تقارير الحضور
```

### المرحلة 5: إدارة الإجازات (أسبوع 8)
```
Week 8: Leave Management
├── أنواع الإجازات
├── طلب إجازة
├── نظام الموافقات
├── رصيد الإجازات
└── تقارير الإجازات
```

### المرحلة 6: نظام الرواتب (أسبوع 9-11)
```
Week 9-11: Payroll System
├── هيكل الرواتب
├── البدلات والخصومات
├── حساب الراتب الشهري
├── Payslips
├── WPS Export
├── GOSI Calculation
└── تقارير الرواتب
```

### المرحلة 7: التكامل السعودي (أسبوع 12)
```
Week 12: Saudi Compliance
├── GOSI Integration
├── WPS File Export
├── Muqeem Validation
├── Mudad Insurance
└── حساب نهاية الخدمة
```

### المرحلة 8: الوحدات الإضافية (أسبوع 13-14)
```
Week 13-14: Additional Modules
├── إدارة الأداء (Performance)
├── إدارة المصروفات (Expenses)
├── التوظيف (Recruitment) - مبسط
└── التقارير والإحصائيات
```

### المرحلة 9: التحسينات والتكامل (أسبوع 15-16)
```
Week 15-16: Polish & Integration
├── Dashboard Analytics
├── Notifications System
├── Mobile Responsive
├── Testing
├── Documentation
└── Deployment
```

---

## 🗄️ Database Schema (Prisma)

```prisma
// ========== Core Models ==========

model Tenant {
  id                String   @id @default(cuid())
  name              String
  nameAr            String?
  commercialRegister String?
  taxNumber         String?
  
  users             User[]
  employees         Employee[]
  departments       Department[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  nameAr    String?
  role      Role
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  SUPER_ADMIN
  COMPANY_ADMIN
  HR_MANAGER
  HR_ADMIN
  EMPLOYEE
  MANAGER
}

// ========== Organization ==========

model Department {
  id          String   @id @default(cuid())
  name        String
  nameAr      String?
  code        String?
  managerId   String?
  manager     Employee? @relation("DepartmentManager", fields: [managerId], references: [id])
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  
  employees   Employee[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ========== Employees ==========

model Employee {
  id                String   @id @default(cuid())
  employeeNumber    String   @unique
  
  // Personal Info
  firstName         String
  firstNameAr       String?
  lastName          String
  lastNameAr        String?
  email             String   @unique
  phone             String?
  dateOfBirth       DateTime?
  gender            Gender
  nationality       String?
  nationalId        String?  // Saudi National ID
  iqamaNumber       String?  // Iqama for expats
  iqamaExpiry       DateTime?
  passportNumber    String?
  
  // Employment Info
  hireDate          DateTime
  employmentStatus  EmploymentStatus
  employmentType    EmploymentType
  jobTitleId        String?
  jobTitle          JobTitle? @relation(fields: [jobTitleId], references: [id])
  departmentId      String?
  department        Department? @relation(fields: [departmentId], references: [id])
  managerId         String?
  manager           Employee? @relation("EmployeeManager", fields: [managerId], references: [id])
  subordinates      Employee[] @relation("EmployeeManager")
  
  // Salary Info
  baseSalary        Decimal  @db.Decimal(12, 2)
  housingAllowance  Decimal? @db.Decimal(12, 2)
  transportAllowance Decimal? @db.Decimal(12, 2)
  
  // Relations
  tenantId          String
  tenant            Tenant   @relation(fields: [tenantId], references: [id])
  managedDepartments Department[] @relation("DepartmentManager")
  attendanceRecords AttendanceRecord[]
  leaveRequests     LeaveRequest[]
  payrollEntries    PayrollEntry[]
  documents         EmployeeDocument[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([tenantId])
  @@index([departmentId])
}

enum Gender {
  MALE
  FEMALE
}

enum EmploymentStatus {
  ACTIVE
  SUSPENDED
  TERMINATED
  NOTICE_PERIOD
}

enum EmploymentType {
  FULL_TIME
  PART_TIME
  CONTRACT
  INTERN
}

model JobTitle {
  id          String   @id @default(cuid())
  title       String
  titleAr     String?
  level       String?
  
  employees   Employee[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model EmployeeDocument {
  id          String   @id @default(cuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  
  type        DocumentType
  title       String
  fileUrl     String
  uploadDate  DateTime @default(now())
  expiryDate  DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum DocumentType {
  ID_COPY
  IQAMA_COPY
  PASSPORT_COPY
  CONTRACT
  CERTIFICATE
  OTHER
}

// ========== Attendance ==========

model Shift {
  id          String   @id @default(cuid())
  name        String
  nameAr      String?
  startTime   String   // HH:mm format
  endTime     String   // HH:mm format
  workingHours Decimal @db.Decimal(4, 2)
  
  employeeShifts EmployeeShift[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model EmployeeShift {
  id          String   @id @default(cuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  shiftId     String
  shift       Shift    @relation(fields: [shiftId], references: [id])
  
  effectiveDate DateTime
  endDate       DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model AttendanceRecord {
  id          String   @id @default(cuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  
  date        DateTime @db.Date
  checkIn     DateTime?
  checkOut    DateTime?
  workingHours Decimal? @db.Decimal(4, 2)
  overtimeHours Decimal? @db.Decimal(4, 2)
  lateMinutes Int?
  earlyLeaveMinutes Int?
  status      AttendanceStatus
  
  // GPS Location
  checkInLat  Decimal? @db.Decimal(10, 8)
  checkInLng  Decimal? @db.Decimal(11, 8)
  checkOutLat Decimal? @db.Decimal(10, 8)
  checkOutLng Decimal? @db.Decimal(11, 8)
  
  notes       String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([employeeId, date])
  @@index([employeeId])
  @@index([date])
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  HALF_DAY
  LATE
  EARLY_LEAVE
  LEAVE
  WEEKEND
  HOLIDAY
}

// ========== Leave Management ==========

model LeaveType {
  id          String   @id @default(cuid())
  name        String
  nameAr      String?
  code        String   @unique
  maxDays     Int?
  paidLeave   Boolean  @default(true)
  requiresApproval Boolean @default(true)
  
  leaveRequests LeaveRequest[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model LeaveRequest {
  id          String   @id @default(cuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  leaveTypeId String
  leaveType   LeaveType @relation(fields: [leaveTypeId], references: [id])
  
  startDate   DateTime @db.Date
  endDate     DateTime @db.Date
  totalDays   Int
  reason      String?
  
  status      LeaveStatus
  approvedBy  String?
  approvedAt  DateTime?
  rejectionReason String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([employeeId])
  @@index([status])
}

enum LeaveStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

// ========== Payroll ==========

model PayrollCycle {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  
  periodStart DateTime @db.Date
  periodEnd   DateTime @db.Date
  month       Int
  year        Int
  
  status      PayrollStatus
  totalGross  Decimal  @db.Decimal(14, 2)
  totalDeductions Decimal @db.Decimal(14, 2)
  totalNet    Decimal  @db.Decimal(14, 2)
  
  processedBy String?
  processedAt DateTime?
  approvedBy  String?
  approvedAt  DateTime?
  
  entries     PayrollEntry[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([tenantId, year, month])
}

enum PayrollStatus {
  DRAFT
  PROCESSING
  PROCESSED
  APPROVED
  PAID
}

model PayrollEntry {
  id          String   @id @default(cuid())
  payrollCycleId String
  payrollCycle PayrollCycle @relation(fields: [payrollCycleId], references: [id])
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  
  // Earnings
  basicSalary Decimal  @db.Decimal(12, 2)
  housingAllowance Decimal? @db.Decimal(12, 2)
  transportAllowance Decimal? @db.Decimal(12, 2)
  otherAllowances Decimal? @db.Decimal(12, 2)
  overtimeAmount Decimal? @db.Decimal(12, 2)
  grossSalary Decimal  @db.Decimal(12, 2)
  
  // Deductions
  gosiEmployee Decimal? @db.Decimal(12, 2)
  gosiEmployer Decimal? @db.Decimal(12, 2)
  loans       Decimal? @db.Decimal(12, 2)
  advances    Decimal? @db.Decimal(12, 2)
  otherDeductions Decimal? @db.Decimal(12, 2)
  
  netSalary   Decimal  @db.Decimal(12, 2)
  
  // Working Days
  workingDays Int
  actualDays  Int
  absentDays  Int?
  
  payslipGenerated Boolean @default(false)
  payslipUrl  String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([payrollCycleId, employeeId])
  @@index([employeeId])
}

// ========== Performance ==========

model PerformanceReview {
  id          String   @id @default(cuid())
  employeeId  String
  reviewerId  String
  
  period      String
  reviewDate  DateTime
  overallRating Decimal? @db.Decimal(3, 2)
  
  strengths   String?
  areasForImprovement String?
  goals       String?
  comments    String?
  
  status      ReviewStatus
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum ReviewStatus {
  DRAFT
  SUBMITTED
  REVIEWED
  COMPLETED
}

// ========== Expenses ==========

model ExpenseRequest {
  id          String   @id @default(cuid())
  employeeId  String
  
  category    String
  amount      Decimal  @db.Decimal(10, 2)
  currency    String   @default("SAR")
  date        DateTime @db.Date
  description String?
  
  receiptUrl  String?
  
  status      ExpenseStatus
  approvedBy  String?
  approvedAt  DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum ExpenseStatus {
  PENDING
  APPROVED
  REJECTED
  PAID
}

// ========== Recruitment ==========

model JobPosting {
  id          String   @id @default(cuid())
  title       String
  titleAr     String?
  description String
  
  departmentId String?
  location    String?
  jobType     String?
  salaryRange String?
  
  status      JobStatus
  publishedAt DateTime?
  closedAt    DateTime?
  
  applications Application[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum JobStatus {
  DRAFT
  PUBLISHED
  CLOSED
}

model Application {
  id          String   @id @default(cuid())
  jobPostingId String
  jobPosting  JobPosting @relation(fields: [jobPostingId], references: [id])
  
  candidateName String
  email       String
  phone       String?
  resumeUrl   String
  
  status      ApplicationStatus
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum ApplicationStatus {
  SUBMITTED
  SCREENING
  INTERVIEW
  OFFER
  HIRED
  REJECTED
}
```

---

## 📁 هيكل المشروع

```
D:\Mahmoud\hghvadt\Jisr\
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── dashboard/
│   │   ├── page.tsx                    # Dashboard الرئيسي
│   │   ├── employees/
│   │   │   ├── page.tsx                # قائمة الموظفين
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx            # تفاصيل الموظف
│   │   │   │   ├── edit/               # تعديل الموظف
│   │   │   │   ├── documents/          # مستندات
│   │   │   │   └── history/            # السجل
│   │   │   └── new/                    # إضافة موظف
│   │   ├── departments/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   ├── attendance/
│   │   │   ├── page.tsx                # سجل الحضور
│   │   │   ├── shifts/                 # إدارة الورديات
│   │   │   └── reports/                # تقارير
│   │   ├── leaves/
│   │   │   ├── page.tsx                # طلبات الإجازات
│   │   │   ├── types/                  # أنواع الإجازات
│   │   │   └── calendar/               # تقويم الإجازات
│   │   ├── payroll/
│   │   │   ├── page.tsx                # دورات الرواتب
│   │   │   ├── [id]/                   # تفاصيل الدورة
│   │   │   ├── process/                # معالجة الرواتب
│   │   │   └── reports/                # تقارير
│   │   ├── performance/
│   │   │   └── page.tsx
│   │   ├── expenses/
│   │   │   └── page.tsx
│   │   ├── recruitment/
│   │   │   ├── jobs/                   # الوظائف
│   │   │   └── applications/           # المتقدمين
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── company/
│   │       ├── users/
│   │       └── integrations/
│   └── api/
│       ├── auth/
│       ├── employees/
│       ├── departments/
│       ├── attendance/
│       ├── leaves/
│       └── payroll/
├── components/
│   ├── ui/                             # shadcn/ui components
│   ├── layout/
│   ├── employees/
│   ├── attendance/
│   └── payroll/
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   └── utils.ts
├── prisma/
│   └── schema.prisma
├── public/
└── i18n/                               # Arabic/English translations
    ├── ar.json
    └── en.json
```

---

## 🎨 UI/UX من refrence0

المشروع مبني على **refrence0shadcn-admin-dashboard-free-main** الموجود لديك، مع:

✅ shadcn/ui components
✅ Dark/Light mode
✅ Responsive design
✅ Modern animations
✅ Arabic RTL support

---

## 🚀 البدء الفوري

### الخطوة 1: Setup Database
```bash
# تعديل .env
DATABASE_URL="postgresql://user:password@localhost:5432/ujoors"

# تشغيل Prisma
pnpm prisma generate
pnpm prisma db push
```

### الخطوة 2: تثبيت الاعتماديات
```bash
pnpm install
```

### الخطوة 3: تشغيل المشروع
```bash
pnpm dev
```

---

## ✅ Checklist التنفيذ

### Week 1-2: الأساسيات ✅
- [ ] Prisma Schema
- [ ] Database Setup
- [ ] Authentication (NextAuth.js)
- [ ] i18n Setup (Arabic/English)
- [ ] Layout & Navigation

### Week 3-4: Employees ⏳
- [ ] Employees List + DataTable
- [ ] Add/Edit Employee Form
- [ ] Employee Profile
- [ ] Documents Upload
- [ ] Org Chart

### Week 5: Departments
- [ ] Departments List
- [ ] Add/Edit Department
- [ ] Department Hierarchy

### Week 6-7: Attendance
- [ ] Check-in/Check-out
- [ ] Shifts Management
- [ ] Attendance Records
- [ ] Reports

### Week 8: Leaves
- [ ] Leave Types
- [ ] Leave Request Form
- [ ] Approval Workflow
- [ ] Leave Calendar

### Week 9-11: Payroll
- [ ] Payroll Cycles
- [ ] Salary Calculation Engine
- [ ] Payslips
- [ ] WPS Export
- [ ] GOSI Calculation

### Week 12: Saudi Compliance
- [ ] GOSI Integration
- [ ] WPS Integration
- [ ] Muqeem Validation

### Week 13-14: Additional
- [ ] Performance Reviews
- [ ] Expense Management
- [ ] Recruitment (Basic)

### Week 15-16: Final
- [ ] Testing
- [ ] Documentation
- [ ] Deployment

---

**📌 Next Step: هل نبدأ بتنفيذ Week 1-2 (الأساسيات)؟**
