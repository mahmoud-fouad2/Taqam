# 🚀 خطة متكاملة لبناء منصة أجور (Ujoors) - نظام إدارة الموارد البشرية والمالية

> ⛔ **تحذير: هذا الملف غير قابل للحذف نهائيًا**
> 
> **تنبيه مرجعية:** الخطة الأصلية الحقيقية (Canonical Plan) هي: **UJOORS_COMPLETE_PLAN.md**
>
> هذا الملف هو **خطة تنفيذ تشغيلية داخل الريبو** (Execution Playbook) ويجب أن يبقى **متوافقًا** مع الخطة الأصلية.
> - ✅ مسموح: التحديث والتحسين والإضافة
> - ❌ ممنوع: الحذف أو إعادة الإنشاء من الصفر
> 
> آخر تحديث: 2026-01-24

---

## 📊 نظرة عامة على المنصة

منصة أجور (Ujoors) هي نظام شامل يجمع بين إدارة الموارد البشرية (HR) والعمليات المالية في منصة واحدة، مصممة خصيصاً للسوق السعودي والشرق الأوسط.

### الخدمات الرئيسية:
1. **Core HR Suite** - إدارة الموارد البشرية
2. **Talent Suite** - إدارة المواهب والتوظيف
3. **Spend Suite** - إدارة النفقات والمصروفات
4. **Payroll Management** - إدارة الرواتب
5. **Time & Attendance** - الحضور والانصراف
6. **Compliance** - الامتثال (GOSI, Muqeem, WPS, Mudad)
7. **Performance Management** - إدارة الأداء
8. **Learning Management** - إدارة التعلم

---

## ✅ تقسيم التنفيذ إلى 6 مراحل (2026) — 10 TODOs لكل مرحلة

> القاعدة: لا يوجد Self‑Signup للشركات. إنشاء الشركة (Tenant) يتم فقط عبر Super Admin.

### Phase 1 — Foundation & UX Baseline (الأساس وتجربة المستخدم) ✅ COMPLETED
- [x] تثبيت معايير UX: RTL sidebar يمين + مكونات عربية/إنجليزية بجودة عالية
- [x] توحيد التصميم (Design System) على shadcn + توحيد tokens والألوان
- [x] تفعيل ثيم Mantine كتجربة بديلة (Theme B) عبر Adapter تدريجي *(جزئي)*
- [x] تثبيت الخط IBM Plex Sans Arabic محليًا وربطه كـ default
- [x] إعداد i18n فعلي (ترجمة مفاتيح) بدل نصوص hardcoded
- [x] تفعيل Multi-Tenant Resolver (subdomain) كمسار رسمي لكل request
- [x] إعداد Auth skeleton (جلسة/توكن) بدون أي flows للشركات من الواجهة
- [x] إضافة Guards بسيطة للـroutes (guest vs dashboard)
- [x] تنظيف شامل لبقايا التمبلت (Get Pro/Free/روابط خارجية/نصوص demo)
- [x] توثيق “تعريفات المنتج” (Roles, Tenant, Locale, Theme) داخل الخطة

### Phase 2 — Super Admin & Tenant Provisioning (إدارة الشركات) ✅ COMPLETED
- [x] إنشاء مساحة /dashboard/super-admin محمية (Super Admin فقط)
- [x] شاشة Tenants: قائمة/بحث/فلترة/حالة الشركة
- [x] Create Tenant Wizard: slug + اسم + إعداد لغة/ثيم افتراضي + بيانات الشركة
- [x] توليد Company Admin user وإرسال دعوة (email placeholder)
- [x] منع أي endpoint بدون tenantId (سياسة صارمة) *(جزئي)*
- [x] Tenant Settings: تغيير الثيم/اللغة الافتراضية وربطها بالكوكيز
- [x] إضافة Audit Log بسيط (من أنشأ/متى/ماذا تغير)
- [x] إضافة Soft delete / suspend للـTenant
- [x] Landing Page + نموذج "طلب اشتراك" (بدون signup)
- [x] Inbox داخلي للطلبات داخل لوحة Super Admin

### Phase 3 — Core HR MVP (الهيكل التنظيمي والموظفين)
- [ ] Organization: Company profile + Branches (أساسي)
- [ ] Departments: CRUD + شجرة بسيطة
- [ ] Job Titles/Positions: CRUD وربطها بالموظفين
- [ ] Employees: إنشاء/تعديل/عرض (الملف الأساسي)
- [ ] Employee Status lifecycle (active/onboarding/terminated)
- [ ] Documents: رفع/عرض (R2 لاحقًا، Local dev الآن)
- [ ] Permissions/Roles داخل الشركة (Company Admin/Manager/Employee)
- [ ] Bulk import skeleton (CSV) مع validation
- [ ] Search & filters قوية على الموظفين (اسم/قسم/حالة)
- [ ] UX polish: empty states + loading + error states بجودة إنتاجية

### Phase 4 — Time & Attendance MVP (الحضور والانصراف)
- [ ] Shifts: تعريف الشفتات والقواعد الأساسية
- [ ] Attendance records: تسجيل دخول/خروج يدوي (MVP)
- [ ] Policies: late/early/overtime rules (مبدئي)
- [ ] Requests: إذن/تصحيح حضور (workflow بسيط)
- [ ] Calendar view للحضور
- [ ] Reports: ملخص أسبوعي/شهري
- [ ] Integrate مع الموظف (ربط attendance بـ employeeId)
- [ ] Notifications skeleton (in-app) للأحداث المهمة
- [ ] Multi‑tenant data isolation tests (أساسية)
- [ ] تحسينات الأداء للـtables والـfilters (virtualization عند الحاجة)

### Phase 5 — Payroll & Compliance MVP (الرواتب والامتثال)
- [ ] Payroll cycles: إعداد دورة راتب وربطها بالشركة
- [ ] Salary components: basic/allowances/deductions
- [ ] Payroll run: حساب مبدئي + preview + approve
- [ ] Payslip generation (PDF placeholder أوليًا)
- [ ] WPS export placeholder (format stub)
- [ ] GOSI/Mudad/Muqeem integration placeholders (adapters)
- [ ] End of service calculation MVP
- [ ] Audit trail للرواتب (من نفذ/وافق)
- [ ] Role-based access للرواتب (قيود صارمة)
- [ ] QA سيناريوهات رواتب عربية/إنجليزية + RTL reports

### Phase 6 — Production Hardening & Scale (جاهزية الإنتاج والتوسع)
- [ ] Render deploy blueprint: env vars + health checks + build settings
- [ ] PostgreSQL/Prisma foundation + migration strategy
- [ ] Redis/BullMQ jobs للمهام الثقيلة (exports/emails)
- [ ] Cloudflare R2 integration للملفات + سياسة وصول
- [ ] Observability: Sentry + structured logs + basic metrics
- [ ] Security hardening: rate limiting + CSRF + session policy
- [ ] Backup/Restore plan + runbooks
- [ ] Integration layer framework (webhooks + inbound/outbound)
- [ ] Performance budgets (Core Web Vitals) + regression checks
- [ ] Release process: feature flags + staging + rollbacks

### قالب تحديث الخطة بعد كل مرحلة
عند إنهاء أي Phase: يتم تحديث هذا القسم فقط (بدون حذف أي شيء من الخطة):

**Phase Status**
- Phase 1: ✅ Completed (2026-01-24)
- Phase 2: ✅ Completed (2026-01-24)
- Phase 3: Not started
- Phase 4: Not started
- Phase 5: Not started
- Phase 6: Not started

**Phase Notes (آخر تحديث: 2026-01-24)**
- ما الذي اكتمل:
  - [x] تثبيت معايير UX: RTL sidebar يمين + مكونات عربية/إنجليزية
  - [x] توحيد التصميم على shadcn + إنشاء design-tokens.ts
  - [x] تثبيت الخط IBM Plex Sans Arabic محليًا
  - [x] إعداد i18n فعلي (next-intl + ar.json + en.json)
  - [x] تفعيل Multi-Tenant Resolver (proxy.ts + lib/tenant.ts)
  - [x] إعداد Auth skeleton (lib/auth.ts + lib/guards.ts)
  - [x] تنظيف بقايا التمبلت (Get Pro/Free/روابط خارجية)
  - [x] توثيق "تعريفات المنتج" (docs/PRODUCT_DEFINITIONS.md)
  - [x] Super Admin Dashboard + Layout محمي
  - [x] شاشة Tenants (قائمة + بحث + فلترة + جدول)
  - [x] Create Tenant Wizard + validation
  - [x] Tenant Details + Settings pages
  - [x] Audit Log في صفحة Tenant
  - [x] Landing Page للمنصة
  - [x] نموذج طلب اشتراك (request-demo)
  - [x] Inbox طلبات الاشتراك
- ما الذي تغير عن الخطة: لا شيء جوهري
- مخاطر/ديون تقنية:
  - Mantine كـ Theme B لم يُفعّل بعد (يحتاج Adapter)
  - Auth skeleton يحتاج ربط بـ backend حقيقي
  - tenantId policy يحتاج middleware كامل
- التالي مباشرة: Phase 3 (Core HR MVP)

---

## 🏗️ البنية المعمارية - Domain-Based Architecture (DDD)

### المبادئ الأساسية:
```
📁 Project Root
├── 📁 apps/                          # Monorepo Applications
│   ├── 📁 web-admin/                 # لوحة تحكم الإدارة
│   ├── 📁 web-employee/              # بوابة الموظفين
│   ├── 📁 web-manager/               # بوابة المديرين
│   ├── 📁 mobile-app/                # تطبيق الموبايل (React Native)
│   └── 📁 landing-page/              # الموقع التسويقي
│
├── 📁 packages/                      # Shared Packages
│   ├── 📁 ui/                        # مكتبة المكونات المشتركة
│   ├── 📁 config/                    # إعدادات مشتركة
│   ├── 📁 types/                     # TypeScript Types
│   ├── 📁 utils/                     # دوال مساعدة
│   └── 📁 api-client/                # HTTP Client مشترك
│
├── 📁 services/                      # Microservices Backend
│   ├── 📁 api-gateway/               # API Gateway (NestJS)
│   ├── 📁 auth-service/              # خدمة المصادقة
│   ├── 📁 hr-service/                # خدمة الموارد البشرية
│   ├── 📁 payroll-service/           # خدمة الرواتب
│   ├── 📁 attendance-service/        # خدمة الحضور
│   ├── 📁 recruitment-service/       # خدمة التوظيف
│   ├── 📁 performance-service/       # خدمة الأداء
│   ├── 📁 learning-service/          # خدمة التعلم
│   ├── 📁 expense-service/           # خدمة المصروفات
│   ├── 📁 compliance-service/        # خدمة الامتثال
│   ├── 📁 notification-service/      # خدمة الإشعارات
│   ├── 📁 analytics-service/         # خدمة التحليلات
│   └── 📁 integration-service/       # خدمة التكاملات الخارجية
│
├── 📁 domains/                       # Domain Models (DDD)
│   ├── 📁 employee/                  # نطاق الموظفين
│   │   ├── domain/                   # Domain Models
│   │   ├── application/              # Use Cases
│   │   ├── infrastructure/           # Database, APIs
│   │   └── presentation/             # Controllers
│   ├── 📁 payroll/                   # نطاق الرواتب
│   ├── 📁 attendance/                # نطاق الحضور
│   ├── 📁 recruitment/               # نطاق التوظيف
│   ├── 📁 performance/               # نطاق الأداء
│   ├── 📁 learning/                  # نطاق التعلم
│   ├── 📁 expense/                   # نطاق المصروفات
│   └── 📁 organization/              # نطاق المؤسسة
│
├── 📁 infrastructure/                # Infrastructure Layer
│   ├── 📁 database/                  # Database Configs
│   ├── 📁 message-queue/             # RabbitMQ/Kafka
│   ├── 📁 cache/                     # Redis
│   ├── 📁 storage/                   # File Storage (Cloudflare R2 - S3 compatible)
│   └── 📁 monitoring/                # Monitoring Tools
│
└── 📁 docs/                          # Documentation
    ├── api/                          # API Documentation
    ├── architecture/                 # Architecture Docs
    └── user-guides/                  # User Guides
```

---

## 🛠️ التقنيات المستخدمة (أحدث الوسائل 2025-2026)

### Frontend Stack:
```typescript
{
  "framework": "Next.js 15+ (App Router)",
  "language": "TypeScript 5.9+",
  "styling": {
    "primary": "Tailwind CSS 4.x",
    "components": "shadcn/ui + Radix UI",
    "animations": "Framer Motion + tw-animate-css"
  },
  "stateManagement": {
    "client": "Zustand + React Query (TanStack Query v5)",
    "server": "React Server Components"
  },
  "forms": "React Hook Form + Zod",
  "tables": "TanStack Table v8",
  "charts": "Recharts + D3.js",
  "i18n": "next-intl (Arabic/English)",
  "rtl": "Built-in RTL support",
  "mobile": "React Native + Expo (Shared logic with web)"
}
```

### Backend Stack:
```typescript
{
  "framework": "NestJS 10+ (Microservices)",
  "language": "TypeScript 5.9+",
  "apiGateway": "NestJS API Gateway + GraphQL Federation",
  "authentication": {
    "jwt": "Passport JWT + Refresh Tokens",
    "oauth": "OAuth 2.0 + OpenID Connect",
    "2fa": "TOTP (Time-based OTP)",
    "sso": "SAML 2.0 + Azure AD"
  },
  "database": {
    "primary": "PostgreSQL 16+ (Main DB)",
    "orm": "Prisma 6+ / TypeORM",
    "search": "Elasticsearch 8+",
    "timeseries": "TimescaleDB (للحضور والتقارير)"
  },
  "cache": "Redis 7+ (Caching + Sessions + Queues)",
  "messageQueue": "RabbitMQ / Apache Kafka",
  "fileStorage": "Cloudflare R2 (S3-compatible) / MinIO (local dev)",
  "realtime": "Socket.io + Server-Sent Events",
  "jobScheduler": "Bull MQ + Cron Jobs"
}
```

### DevOps & Infrastructure:
```yaml
containerization: Docker + Docker Compose
orchestration: Kubernetes (K8s) + Helm Charts
ci_cd: GitHub Actions / GitLab CI
monitoring:
  - Prometheus + Grafana (Metrics)
  - ELK Stack (Logs - Elasticsearch, Logstash, Kibana)
  - Sentry (Error Tracking)
  - New Relic / DataDog (APM)
tracing: OpenTelemetry + Jaeger
testing:
  unit: Jest + Vitest
  e2e: Playwright + Cypress
  load: K6 / Artillery
security:
  - SonarQube (Code Quality)
  - OWASP ZAP (Security Scanning)
  - Snyk (Dependency Scanning)
cloud: AWS / Azure / GCP (Multi-cloud ready)
```

### External Integrations:
```typescript
{
  "saudi_compliance": [
    "GOSI API Integration",
    "Muqeem (Iqama validation)",
    "WPS (Wage Protection System)",
    "Mudad (Insurance)",
    "ZATCA (e-Invoice Integration)"
  ],
  "erp_systems": [
    "SAP",
    "Oracle NetSuite",
    "Microsoft Dynamics 365",
    "Odoo"
  ],
  "accounting": [
    "QuickBooks",
    "Xero",
    "Zoho Books",
    "ZATCA Fatoora"
  ],
  "communication": [
    "Microsoft Teams",
    "Slack",
    "WhatsApp Business API",
    "SMS Gateways (STC, Mobily, Zain)"
  ],
  "payments": [
    "HyperPay",
    "Moyasar",
    "Stripe",
    "Mada Payment Gateway"
  ]
}
```

---

## 📋 خطة التنفيذ التفصيلية (24 شهراً)

### المرحلة 1: التأسيس والبنية التحتية (شهر 1-3)

#### Sprint 1-2: إعداد البيئة والبنية الأساسية
```bash
Week 1-2: Project Setup
- ✅ إنشاء Monorepo (Turborepo / Nx)
- ✅ إعداد Git Strategy (GitFlow)
- ✅ Docker Development Environment
- ✅ CI/CD Pipeline Setup
- ✅ Code Quality Tools (ESLint, Prettier, Husky)

Week 3-4: Core Infrastructure
- ✅ Database Schema Design (Prisma)
- ✅ API Gateway Setup (NestJS)
- ✅ Authentication Service (JWT + OAuth)
- ✅ Redis Cache Setup
- ✅ Message Queue Setup (RabbitMQ)
```

#### Sprint 3-4: UI Foundation & Design System
```bash
Week 5-6: Design System
- ✅ إنشاء مكتبة UI Components (shadcn/ui)
- ✅ Theme System: Dark/Light + 2 UI Themes (refrence1 / refrence2)
- ✅ Tenant Theme Selector (الشركة تختار من 2 ثيم)
- ✅ Platform Default Theme (Super Admin يقدر يغير شكل المنصة)
- ✅ RTL Support Implementation
- ✅ Arabic Font Integration (Cairo, Almarai)
- ✅ Storybook Setup للمكونات

Week 7-8: Layout & Navigation
- ✅ Admin Dashboard Layout
- ✅ Employee Portal Layout
- ✅ Manager Portal Layout
- ✅ Responsive Sidebar Navigation
- ✅ Multi-language Support (AR/EN)
```

---

### المرحلة 2: Core HR Module (شهر 4-7)

#### Domain: Employee Management
```typescript
// domains/employee/domain/entities/employee.entity.ts
export class Employee {
  // Value Objects
  id: EmployeeId
  personalInfo: PersonalInfo
  contactInfo: ContactInfo
  employment: EmploymentDetails
  documents: Documents[]
  
  // Business Logic
  calculateServiceYears(): number
  isEligibleForLeave(): boolean
  calculateEndOfService(): Money
}
```

#### Sprint 5-8: Employee Module
```bash
Week 9-12: Employee Management
- ✅ Employee CRUD Operations
- ✅ Employee Profile (Personal Info, Documents)
- ✅ Employee Hierarchy & Org Chart
- ✅ Employee Documents Management
- ✅ Employee History & Audit Trail
- ✅ Bulk Import/Export (Excel/CSV)

Week 13-16: Organization Structure
- ✅ Company Structure Setup
- ✅ Departments Management
- ✅ Job Titles & Positions
- ✅ Cost Centers
- ✅ Projects Management
- ✅ Custom Fields & Forms
```

#### Sprint 9-12: Leave Management
```bash
Week 17-20: Leave System
- ✅ Leave Types Configuration
- ✅ Leave Policies & Rules
- ✅ Leave Request Workflow
- ✅ Leave Calendar & Balance
- ✅ Manager Approval System
- ✅ Leave Accrual Calculation
- ✅ Public Holidays Management

Week 21-24: Document Management
- ✅ Document Templates
- ✅ Document Generation (PDF)
- ✅ Digital Signatures
- ✅ Document Workflows
- ✅ Document Archiving
```

---

### المرحلة 3: Payroll Module (شهر 8-11)

#### Domain: Payroll
```typescript
// domains/payroll/domain/entities/payroll.entity.ts
export class Payroll {
  period: PayrollPeriod
  employees: PayrollEmployee[]
  
  calculateGrossSalary(): Money
  calculateDeductions(): Money
  calculateNetSalary(): Money
  generatePayslips(): Payslip[]
  exportToWPS(): WPSFile
  integrateWithGOSI(): GOSISubmission
}
```

#### Sprint 13-16: Payroll Core
```bash
Week 25-28: Payroll Engine
- ✅ Salary Structure Configuration
- ✅ Payroll Calculation Engine
- ✅ Allowances & Deductions
- ✅ Overtime Calculation
- ✅ GOSI Calculation
- ✅ Tax Calculation (if applicable)

Week 29-32: Payroll Processing
- ✅ Payroll Run Processing
- ✅ Payroll Approval Workflow
- ✅ Payslip Generation (Arabic/English)
- ✅ Bank File Generation
- ✅ WPS File Export
- ✅ Payroll Reports & Analytics
```

#### Sprint 17-20: Saudi Compliance
```bash
Week 33-36: Compliance Integration
- ✅ GOSI Integration & Reporting
- ✅ Muqeem (Iqama) Integration
- ✅ WPS Submission
- ✅ Mudad Insurance Integration
- ✅ End of Service Calculation
- ✅ Saudi Labor Law Compliance

Week 37-40: Advanced Payroll
- ✅ Salary Loans & Advances
- ✅ Final Settlement Processing
- ✅ Payroll Adjustments
- ✅ Payroll History & Audit
- ✅ Multi-company Payroll
```

---

### المرحلة 4: Attendance & Time Management (شهر 12-14)

#### Domain: Attendance
```typescript
// domains/attendance/domain/entities/attendance.entity.ts
export class Attendance {
  checkIn(): AttendanceRecord
  checkOut(): AttendanceRecord
  calculateWorkingHours(): Hours
  detectLateArrival(): boolean
  detectEarlyLeave(): boolean
  calculateOvertime(): Hours
  applyShiftRules(): void
}
```

#### Sprint 21-24: Attendance System
```bash
Week 41-44: Core Attendance
- ✅ Check-in/Check-out System
- ✅ Shift Management
- ✅ Work Schedules & Rosters
- ✅ GPS-based Check-in
- ✅ Biometric Integration
- ✅ Attendance Policies

Week 45-48: Time Tracking
- ✅ Working Hours Calculation
- ✅ Overtime Tracking
- ✅ Break Time Management
- ✅ Attendance Reports
- ✅ Attendance Exceptions
- ✅ Integration with Payroll
```

---

### المرحلة 5: Recruitment & Talent (شهر 15-17)

#### Domain: Recruitment
```typescript
// domains/recruitment/domain/entities/job-posting.entity.ts
export class JobPosting {
  publish(): void
  receiveApplication(candidate: Candidate): Application
  screenCandidate(): void
  scheduleInterview(): Interview
  makeOffer(): JobOffer
  onboard(): Employee
}
```

#### Sprint 25-28: Recruitment Module
```bash
Week 49-52: ATS System
- ✅ Job Posting Management
- ✅ Candidate Management
- ✅ Application Tracking
- ✅ Resume Parsing (AI)
- ✅ Interview Scheduling
- ✅ Candidate Evaluation

Week 53-56: Hiring Pipeline
- ✅ Hiring Workflow Builder
- ✅ Offer Management
- ✅ Onboarding Workflows
- ✅ Integration with Job Boards
- ✅ Recruitment Analytics
- ✅ Career Portal
```

---

### المرحلة 6: Performance & Learning (شهر 18-20)

#### Sprint 29-32: Performance Management
```bash
Week 57-60: Performance System
- ✅ Goal Setting (OKRs/KPIs)
- ✅ Performance Reviews
- ✅ 360-Degree Feedback
- ✅ Performance Rating System
- ✅ Performance Improvement Plans
- ✅ Performance Analytics

Week 61-64: Learning Management
- ✅ Course Management
- ✅ Learning Paths
- ✅ Training Assignments
- ✅ Certifications Tracking
- ✅ Skills Matrix
- ✅ Learning Analytics
```

---

### المرحلة 7: Expense & Travel (شهر 21-22)

#### Domain: Expense
```typescript
// domains/expense/domain/entities/expense.entity.ts
export class Expense {
  submit(): void
  attachReceipts(): void
  validatePolicy(): boolean
  requestApproval(): void
  processReimbursement(): void
  integrateWithAccounting(): void
}
```

#### Sprint 33-36: Spend Management
```bash
Week 65-68: Expense Management
- ✅ Expense Submission
- ✅ Receipt Scanning (OCR)
- ✅ Expense Policies
- ✅ Approval Workflows
- ✅ Reimbursement Processing
- ✅ Expense Reports

Week 69-72: Travel Management
- ✅ Travel Request System
- ✅ Travel Booking
- ✅ Per Diem Management
- ✅ Travel Advances
- ✅ Travel Reports
- ✅ Card Management System
```

---

### المرحلة 8: Analytics & Mobile (شهر 23-24)

#### Sprint 37-40: Advanced Features
```bash
Week 73-76: Analytics Dashboard
- ✅ HR Analytics Dashboard
- ✅ Custom Reports Builder
- ✅ Data Visualization
- ✅ Predictive Analytics (AI)
- ✅ Workforce Planning
- ✅ Salary Benchmarking

Week 77-80: Mobile App
- ✅ Employee Mobile App (React Native)
- ✅ Manager Mobile App
- ✅ Push Notifications
- ✅ Offline Mode Support
- ✅ Biometric Login
- ✅ App Store Deployment

Week 81-84: Integration & Optimization
- ✅ ERP Integrations
- ✅ API Marketplace
- ✅ Webhook System
- ✅ Performance Optimization
- ✅ Security Audit
- ✅ Load Testing
```

---

## 🎨 تصميم واجهة المستخدم (UI/UX)

### 🎭 نظام الثيمات (2 Designs + Dark/Light)

الهدف: يكون عندنا **شكلين (Designs)** ثابتين تختار منهم الشركات، ومعهم **Dark/Light**.

**الثيمات:**
- `refrence1` (Theme A)
- `refrence2` (Theme B)

**التحكم:**
- الشركة تختار من الثيمين (إذا كان مسموح لها في إعدادات المنصة/العقد)
- Super Admin يحدد **Default Theme** للمنصة، ويقدر يقفل/يفتح اختيار الشركات

**أفضل ممارسة تنفيذية (بدون تعقيد):**
- نعتمد على CSS Variables (Design Tokens) مع shadcn/ui
- نضيف ملفين Tokens: `theme-refrence1.css` و `theme-refrence2.css`
- اختيار الثيم يتم عبر `data-ui-theme` على `<html>` (مثلاً: `data-ui-theme="refrence1"`)
- Dark/Light يفضل يظل عبر `next-themes` (class-based) فوق نفس الـ tokens

### Design Principles:
```typescript
const designSystem = {
  // Colors (Based on Ujoors's branding)
  colors: {
    primary: {
      main: '#6366f1',      // Indigo
      light: '#818cf8',
      dark: '#4f46e5'
    },
    success: '#10b981',     // Green
    warning: '#f59e0b',     // Amber
    error: '#ef4444',       // Red
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      // ... full scale
      900: '#111827'
    }
  },
  
  // Typography
  typography: {
    fontFamily: {
      arabic: "'Cairo', 'Almarai', sans-serif",
      english: "'Inter', system-ui, sans-serif"
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    }
  },
  
  // Spacing (Tailwind scale)
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    // ... full scale
  },
  
  // Components
  components: {
    button: {
      sizes: ['sm', 'md', 'lg'],
      variants: ['primary', 'secondary', 'outline', 'ghost']
    },
    card: {
      shadows: ['sm', 'md', 'lg', 'xl'],
      borders: ['none', 'subtle', 'strong']
    }
  }
}
```

### Key Pages:
```
1. Dashboard الرئيسية
   - Overview Cards (موظفين، حضور، رواتب، طلبات)
   - Quick Actions
   - Recent Activities
   - Upcoming Events
   - Analytics Charts

2. Employee Management
   - Employee List (DataTable مع Filters)
   - Employee Profile (Tabs: Info, Documents, History)
   - Organization Chart (Interactive Tree)
   - Bulk Operations

3. Payroll
   - Payroll Calendar
   - Run Payroll Wizard
   - Payslips Generation
   - Payroll Reports
   - WPS Export

4. Attendance
   - Daily Attendance Sheet
   - Time Tracking Dashboard
   - Shift Management
   - Attendance Reports
   - Check-in/out Interface

5. Recruitment
   - Job Postings Board
   - Candidates Pipeline (Kanban)
   - Interview Calendar
   - Offer Management
   - Career Portal

6. Performance
   - Goals Dashboard (OKRs)
   - Review Forms
   - 360 Feedback Interface
   - Performance Matrix
   - Analytics

7. Learning
   - Course Catalog
   - My Learning Path
   - Training Calendar
   - Certifications
   - Skills Assessment

8. Expenses
   - Expense List & Submission
   - Receipt Upload (Drag & Drop)
   - Approval Queue
   - Travel Requests
   - Reports & Analytics
```

---

## 🔐 الأمان والصلاحيات

### Security Architecture:
```typescript
// Security Layers
const securityLayers = {
  authentication: [
    'JWT Access Tokens (15 min expiry)',
    'Refresh Tokens (7 days)',
    'Multi-Factor Authentication (TOTP)',
    'SSO Integration (SAML 2.0, Azure AD)',
    'Password Policies (OWASP)',
    'Account Lockout (Brute Force Protection)'
  ],
  
  authorization: {
    model: 'RBAC (Role-Based Access Control) + ABAC',
    roles: [
      'Super Admin',
      'Company Admin',
      'HR Manager',
      'HR Admin',
      'Payroll Manager',
      'Department Manager',
      'Employee',
      'Custom Roles'
    ],
    permissions: {
      granular: 'Resource.Action (e.g., employee.read, payroll.write)',
      inheritance: 'Hierarchical role inheritance',
      dataScoping: 'Row-level security (own data, department, company)'
    }
  },
  
  dataProtection: [
    'Encryption at Rest (AES-256)',
    'Encryption in Transit (TLS 1.3)',
    'PII Data Masking',
    'Data Retention Policies',
    'GDPR Compliance',
    'Saudi Data Residency'
  ],
  
  audit: [
    'Complete Audit Trail',
    'User Activity Logging',
    'Data Change History',
    'Compliance Reports',
    'Security Alerts'
  ],
  
  api: [
    'Rate Limiting',
    'CORS Protection',
    'CSRF Tokens',
    'XSS Prevention',
    'SQL Injection Prevention',
    'Input Validation (Zod)',
    'API Key Management'
  ]
}
```

### Permission Matrix Example:
```typescript
// Example: Permission System
enum Permission {
  // Employees
  EMPLOYEE_VIEW = 'employee.view',
  EMPLOYEE_CREATE = 'employee.create',
  EMPLOYEE_EDIT = 'employee.edit',
  EMPLOYEE_DELETE = 'employee.delete',
  EMPLOYEE_VIEW_SALARY = 'employee.view_salary',
  
  // Payroll
  PAYROLL_VIEW = 'payroll.view',
  PAYROLL_RUN = 'payroll.run',
  PAYROLL_APPROVE = 'payroll.approve',
  PAYROLL_REPORTS = 'payroll.reports',
  
  // ... more permissions
}

const rolePermissions = {
  superAdmin: ['*'], // All permissions
  hrManager: [
    Permission.EMPLOYEE_VIEW,
    Permission.EMPLOYEE_CREATE,
    Permission.EMPLOYEE_EDIT,
    Permission.PAYROLL_VIEW,
    Permission.PAYROLL_REPORTS,
    // ... more
  ],
  employee: [
    Permission.EMPLOYEE_VIEW, // Only own profile
    'leave.request',
    'attendance.checkin',
    'expense.submit',
    // ... limited permissions
  ]
}
```

---

## 📊 قاعدة البيانات

### Database Schema (Core Tables):
```sql
-- Companies (Multi-tenancy)
CREATE TABLE companies (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    commercial_register VARCHAR(50),
    tax_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Employees
CREATE TABLE employees (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    employee_number VARCHAR(50) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    first_name_ar VARCHAR(100),
    last_name_ar VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    national_id VARCHAR(50),
    iqama_number VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(10),
    nationality VARCHAR(50),
    hire_date DATE,
    employment_status VARCHAR(50),
    job_title_id UUID,
    department_id UUID,
    manager_id UUID,
    salary_base DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Payroll Cycles
CREATE TABLE payroll_cycles (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    period_start DATE,
    period_end DATE,
    status VARCHAR(50), -- draft, processing, approved, paid
    total_gross DECIMAL(14, 2),
    total_deductions DECIMAL(14, 2),
    total_net DECIMAL(14, 2),
    processed_by UUID,
    approved_by UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payroll Entries
CREATE TABLE payroll_entries (
    id UUID PRIMARY KEY,
    payroll_cycle_id UUID REFERENCES payroll_cycles(id),
    employee_id UUID REFERENCES employees(id),
    basic_salary DECIMAL(12, 2),
    housing_allowance DECIMAL(12, 2),
    transportation_allowance DECIMAL(12, 2),
    other_allowances DECIMAL(12, 2),
    overtime_amount DECIMAL(12, 2),
    gross_salary DECIMAL(12, 2),
    gosi_employee DECIMAL(12, 2),
    gosi_employer DECIMAL(12, 2),
    loans DECIMAL(12, 2),
    advances DECIMAL(12, 2),
    other_deductions DECIMAL(12, 2),
    net_salary DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Attendance Records
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY,
    employee_id UUID REFERENCES employees(id),
    date DATE,
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    working_hours DECIMAL(4, 2),
    overtime_hours DECIMAL(4, 2),
    late_minutes INT,
    early_leave_minutes INT,
    status VARCHAR(50), -- present, absent, half-day, leave
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Leave Requests
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY,
    employee_id UUID REFERENCES employees(id),
    leave_type_id UUID,
    start_date DATE,
    end_date DATE,
    total_days INT,
    reason TEXT,
    status VARCHAR(50), -- pending, approved, rejected
    approved_by UUID,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ... More tables for other domains
```

---

## 🚀 خطة الإطلاق (Go-Live)

### Pre-Launch Checklist:
```bash
✅ Phase 1: Beta Testing (Month 22)
  - Internal Testing
  - User Acceptance Testing (UAT)
  - Security Penetration Testing
  - Performance & Load Testing
  - Bug Fixes & Optimization

✅ Phase 2: Soft Launch (Month 23)
  - Limited Customer Pilot (5-10 companies)
  - Data Migration Tools
  - Training Materials
  - Support Documentation
  - Feedback Collection

✅ Phase 3: Official Launch (Month 24)
  - Marketing Campaign
  - Sales Enablement
  - Customer Onboarding Process
  - Support Team Training
  - Monitoring & Incident Response
```

---

## 💰 تقدير التكاليف والموارد

### Team Requirements:
```yaml
Development Team:
  - 1 × Technical Lead / Architect
  - 3 × Senior Full-Stack Engineers (NestJS + Next.js)
  - 2 × Frontend Engineers (React/Next.js)
  - 2 × Backend Engineers (NestJS/Microservices)
  - 1 × Mobile Engineer (React Native)
  - 1 × DevOps Engineer
  - 1 × QA Engineer
  - 1 × Database Administrator

Product & Design:
  - 1 × Product Manager
  - 1 × UI/UX Designer
  - 1 × Business Analyst

Total: ~14 people

Estimated Budget (24 months):
  - Development: $800K - $1.2M
  - Infrastructure (AWS): $50K - $100K
  - Tools & Licenses: $30K - $50K
  - Total: ~$880K - $1.35M
```

### Infrastructure Costs (Monthly):
```yaml
AWS/Cloud Services:
  - EC2/ECS (Microservices): $300-500
  - RDS (PostgreSQL): $200-400
  - ElastiCache (Redis): $100-200
  - R2 Storage (S3-compatible): $50-100
  - CloudFront CDN: $100-200
  - Load Balancers: $50-100
  - Monitoring & Logging: $100-200
  Total Monthly: ~$900-1,700

Third-Party Services:
  - SendGrid (Emails): $50-100
  - Twilio (SMS): $100-200
  - Sentry (Error Tracking): $50-100
  - Various APIs: $200-300
  Total Monthly: ~$400-700

Grand Total Monthly: ~$1,300-2,400
```

---

## 📈 خطة النمو والتوسع

### Scalability Strategy:
```typescript
const scalabilityPlan = {
  year1: {
    target: '100-500 companies',
    infrastructure: 'Single Region (Saudi)',
    architecture: 'Microservices on Kubernetes',
    database: 'Master-Replica Setup'
  },
  
  year2: {
    target: '500-2000 companies',
    infrastructure: 'Multi-Region (MENA)',
    architecture: 'Service Mesh (Istio)',
    database: 'Multi-Region Read Replicas'
  },
  
  year3: {
    target: '2000-10000 companies',
    infrastructure: 'Global CDN',
    architecture: 'Event-Driven Architecture',
    database: 'Database Sharding'
  }
}
```

### Feature Roadmap (Post-Launch):
```
Q1 2027:
  - AI-powered Resume Screening
  - Predictive Turnover Analytics
  - Automated Compliance Alerts
  - Advanced Salary Benchmarking

Q2 2027:
  - Mobile App v2.0
  - Employee Wellness Program
  - Skills Gap Analysis (AI)
  - Career Development Paths

Q3 2027:
  - Chatbot HR Assistant (Arabic/English)
  - Video Interview Platform
  - Virtual Onboarding
  - Marketplace for HR Services

Q4 2027:
  - Blockchain for Credentials
  - Metaverse Office Integration
  - Advanced Workforce Analytics (AI/ML)
  - Global Expansion Features
```

---

## 🎯 مؤشرات الأداء الرئيسية (KPIs)

### Technical KPIs:
```yaml
Performance:
  - API Response Time: < 200ms (p95)
  - Page Load Time: < 2s
  - Database Query Time: < 50ms
  - Uptime: 99.9%

Quality:
  - Test Coverage: > 80%
  - Bug Density: < 1 per 1000 LOC
  - Code Duplication: < 3%
  - Technical Debt Ratio: < 5%

Security:
  - Zero Critical Vulnerabilities
  - All Dependencies Updated (Weekly)
  - Security Incidents: 0
  - Penetration Test: Quarterly
```

### Business KPIs:
```yaml
Adoption:
  - Active Users: Target 10K+ (Year 1)
  - User Engagement: > 80% DAU/MAU
  - Customer Retention: > 90%
  - NPS Score: > 50

Revenue:
  - MRR Growth: 15%+ Monthly
  - Customer Acquisition Cost: < $500
  - Lifetime Value: > $10K
  - Churn Rate: < 5%
```

---

## 📚 الموارد والمراجع

### Learning Resources:
```markdown
## Domain-Driven Design:
- Book: "Domain-Driven Design" by Eric Evans
- Book: "Implementing Domain-Driven Design" by Vaughn Vernon
- Course: "Domain-Driven Design Distilled" (Pluralsight)

## Microservices:
- Book: "Building Microservices" by Sam Newman
- Course: NestJS Microservices (Udemy)

## Next.js & React:
- Official Docs: https://nextjs.org/docs
- Course: "Next.js 14 & React" (Maximilian Schwarzmüller)

## Saudi Compliance:
- GOSI Portal: https://www.gosi.gov.sa
- Ministry of Labor: https://hrsd.gov.sa
- ZATCA (Tax): https://zatca.gov.sa
```

---

## ✅ Next Steps - البدء الفوري

### Week 1 Action Items:
```bash
1. Setup Development Environment
   ```bash
   # Create Turborepo
   npx create-turbo@latest ujoors-platform
   
   # Install dependencies
   cd ujoors-platform
   pnpm install
   ```

2. Initialize Projects
   - Create apps/web-admin (Next.js 15)
   - Create services/api-gateway (NestJS)
   - Setup shared packages

3. Setup Infrastructure
   - Docker Compose for local development
   - PostgreSQL + Redis containers
   - Setup Prisma schema

4. Design System
  - Review UI references: `refrence1` و `refrence2` (Design inspiration)
    - ملاحظة: `refrence2` مبني على Mantine؛ نستخدمه كـ inspiration ونطبق نفس الروح عبر shadcn/ui + Tailwind (بدون خلط مكتبتين UI)
  - Setup theme configuration (Dark/Light) + UI theme skins (2)
   - Create base components

5. Authentication
   - Implement JWT strategy
  - Create login + forgot-password + accept-invite pages (no self-service registration)
   - Setup middleware
```

---

## 🎉 الخلاصة

هذه خطة متكاملة لبناء منصة أجور (Ujoors) من الصفر باستخدام أحدث التقنيات و Domain-Based Architecture. الخطة تغطي:

✅ **البنية المعمارية الكاملة** - Microservices + DDD
✅ **التقنيات الحديثة** - Next.js 15, NestJS 10, PostgreSQL 16
✅ **24 شهر من التخطيط** - مفصلة أسبوع بأسبوع
✅ **جميع الوحدات** - HR, Payroll, Attendance, Recruitment, etc.
✅ **التكامل السعودي** - GOSI, WPS, Muqeem, ZATCA
✅ **الأمان والصلاحيات** - RBAC, JWT, Multi-tenancy
✅ **UI/UX Design** - Based on shadcn reference
✅ **DevOps & CI/CD** - Docker, Kubernetes, GitHub Actions
✅ **Scalability** - Ready for 10K+ companies

**الخطوة التالية:**  ابدأ بـ Week 1 Action Items وسأكون معك خطوة بخطوة! 🚀

---

📧 **Need Help?** أي استفسار أو توضيح، أنا هنا للمساعدة!
