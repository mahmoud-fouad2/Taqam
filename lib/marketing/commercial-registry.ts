import { z } from "zod";

const localizedCommercialTextSchema = z.object({
  ar: z.string().trim().min(2).max(240),
  en: z.string().trim().min(2).max(240)
});

const localizedCommercialLongTextSchema = z.object({
  ar: z.string().trim().min(2).max(360),
  en: z.string().trim().min(2).max(360)
});

export const commercialFeatureFamilySchema = z.enum([
  "core-hr",
  "attendance",
  "payroll-compliance",
  "mobile",
  "recruitment",
  "performance",
  "learning",
  "analytics",
  "integrations",
  "automation",
  "platform"
]);

export const commercialFeatureStatusSchema = z.enum(["live", "beta", "gated", "planned"]);
export const commercialTierSchema = z.enum(["core", "advanced", "differentiator", "add-on"]);
export const commercialPlanSchema = z.enum(["starter", "business", "enterprise", "add-on"]);
export const commercialClaimStrengthSchema = z.enum(["core", "supporting", "differentiator"]);
export const commercialClaimVisibilitySchema = z.enum([
  "public",
  "sales-assisted",
  "enterprise-only"
]);
export const commercialClaimStatusGateSchema = z.enum([
  "live-only",
  "allow-beta",
  "internal-only"
]);
export const marketingIntegrationAvailabilitySchema = z.enum(["live", "enterprise-custom"]);
export const commercialClaimSurfaceSchema = z.enum([
  "home.hero",
  "home.feature-grid",
  "home.trust-items",
  "home.proof-pills",
  "home.proof-strip",
  "home.integrations",
  "home.personas",
  "pricing.plan-card",
  "pricing.comparison",
  "plans.summary",
  "features.hero",
  "features.platform-anatomy",
  "features.platform-highlights",
  "features.suite",
  "careers.differentiator",
  "request-demo.sidebar"
]);

export const commercialFeatureSchema = z.object({
  id: z.string().trim().min(3).max(120),
  family: commercialFeatureFamilySchema,
  name: localizedCommercialTextSchema,
  summary: localizedCommercialTextSchema,
  status: commercialFeatureStatusSchema,
  commercialTier: commercialTierSchema,
  availability: z.array(commercialPlanSchema).min(1),
  evidencePaths: z.array(z.string().trim().min(1).max(200)).default([]),
  owner: z.string().trim().min(2).max(120)
});

export const commercialClaimSchema = z.object({
  id: z.string().trim().min(3).max(140),
  surface: commercialClaimSurfaceSchema,
  slot: z.string().trim().min(1).max(80),
  title: localizedCommercialTextSchema,
  description: localizedCommercialTextSchema,
  linkedFeatureIds: z.array(z.string().trim().min(3).max(120)).min(1),
  strength: commercialClaimStrengthSchema,
  visibility: commercialClaimVisibilitySchema,
  statusGate: commercialClaimStatusGateSchema
});

export const marketingIntegrationShowcaseItemSchema = z.object({
  id: z.string().trim().min(2).max(80),
  name: localizedCommercialTextSchema,
  description: localizedCommercialTextSchema,
  logoSrc: z.string().trim().min(1).max(200),
  frameClassName: z.string().trim().min(1).max(120),
  imageClassName: z.string().trim().min(1).max(120),
  availability: marketingIntegrationAvailabilitySchema,
  linkedFeatureIds: z.array(z.string().trim().min(3).max(120)).default([])
});

export const marketingPersonaShowcaseItemSchema = z.object({
  id: z.string().trim().min(2).max(80),
  role: localizedCommercialTextSchema,
  title: localizedCommercialTextSchema,
  description: localizedCommercialTextSchema,
  visualCaption: localizedCommercialTextSchema,
  highlights: z.array(localizedCommercialTextSchema).min(2).max(4),
  linkedFeatureIds: z.array(z.string().trim().min(3).max(120)).min(1)
});

export const marketingTestimonialSchema = z.object({
  id: z.string().trim().min(2).max(80),
  quote: localizedCommercialLongTextSchema,
  name: localizedCommercialTextSchema,
  role: localizedCommercialTextSchema,
  avatarSrc: z.string().trim().min(1).max(200),
  linkedFeatureIds: z.array(z.string().trim().min(3).max(120)).min(1),
  visibility: commercialClaimVisibilitySchema.default("public"),
  statusGate: commercialClaimStatusGateSchema.default("live-only")
});

export const marketingFeatureSuiteIconSchema = z.enum([
  "users",
  "building2",
  "layoutDashboard",
  "clock",
  "smartphone",
  "messageSquare",
  "creditCard",
  "fileDown",
  "wallet",
  "star",
  "target",
  "graduationCap",
  "bookOpen",
  "barChart3",
  "trendingUp",
  "shield",
  "fileSpreadsheet",
  "globe"
]);

export const marketingFeatureSuiteItemSchema = z.object({
  id: z.string().trim().min(2).max(80),
  icon: marketingFeatureSuiteIconSchema,
  title: localizedCommercialTextSchema,
  description: localizedCommercialTextSchema,
  linkedFeatureIds: z.array(z.string().trim().min(3).max(120)).min(1),
  visibility: commercialClaimVisibilitySchema.default("public"),
  statusGate: commercialClaimStatusGateSchema.default("live-only")
});

export const marketingFeatureSuiteSchema = z.object({
  id: z.string().trim().min(2).max(80),
  title: localizedCommercialTextSchema,
  eyebrow: localizedCommercialTextSchema,
  summary: localizedCommercialTextSchema,
  outcomes: z.array(localizedCommercialTextSchema).min(1).max(4),
  items: z.array(marketingFeatureSuiteItemSchema).min(1).max(12),
  sortOrder: z.number().int().min(0).max(9999).default(0)
});

export type CommercialFeature = z.infer<typeof commercialFeatureSchema>;
export type CommercialClaim = z.infer<typeof commercialClaimSchema>;
export type CommercialClaimSurface = z.infer<typeof commercialClaimSurfaceSchema>;
export type MarketingIntegrationShowcaseItem = z.infer<
  typeof marketingIntegrationShowcaseItemSchema
>;
export type MarketingPersonaShowcaseItem = z.infer<typeof marketingPersonaShowcaseItemSchema>;
export type MarketingTestimonial = z.infer<typeof marketingTestimonialSchema>;
export type MarketingFeatureSuiteIconKey = z.infer<typeof marketingFeatureSuiteIconSchema>;
export type MarketingFeatureSuite = z.infer<typeof marketingFeatureSuiteSchema>;

export const defaultCommercialFeatureCatalog = commercialFeatureSchema.array().parse([
  {
    id: "core-hr.employee-management",
    family: "core-hr",
    name: { ar: "إدارة الموظفين والهيكل التنظيمي", en: "Employee management & org structure" },
    summary: {
      ar: "ملفات الموظفين، الأقسام، المسميات، والوثائق الأساسية ضمن مساحة تشغيل واحدة.",
      en: "Employee records, departments, job titles, and core documents in one operating workspace."
    },
    status: "live",
    commercialTier: "core",
    availability: ["starter", "business", "enterprise"],
    evidencePaths: ["/dashboard/employees", "/dashboard/departments", "/dashboard/job-titles"],
    owner: "Core HR"
  },
  {
    id: "attendance.time-and-attendance",
    family: "attendance",
    name: { ar: "الحضور والانصراف والورديات", en: "Time, attendance, and shifts" },
    summary: {
      ar: "تسجيل الحضور، الورديات، وسياسات العمل اليومية على الويب والجوال.",
      en: "Attendance capture, shift scheduling, and daily work policies across web and mobile."
    },
    status: "live",
    commercialTier: "core",
    availability: ["starter", "business", "enterprise"],
    evidencePaths: ["/dashboard/attendance", "/dashboard/shifts", "/m/attendance"],
    owner: "Attendance"
  },
  {
    id: "attendance.leave-management",
    family: "attendance",
    name: { ar: "الإجازات والطلبات الذاتية", en: "Leave and self-service requests" },
    summary: {
      ar: "أرصدة الإجازات، الطلبات، والموافقات الأساسية للموظف والمدير.",
      en: "Leave balances, employee requests, and manager approval flows."
    },
    status: "live",
    commercialTier: "core",
    availability: ["starter", "business", "enterprise"],
    evidencePaths: ["/dashboard/leave-requests", "/m/requests"],
    owner: "Workflows"
  },
  {
    id: "payroll.saudi-payroll",
    family: "payroll-compliance",
    name: { ar: "الرواتب والمسير الشهري", en: "Payroll and monthly runs" },
    summary: {
      ar: "مسير رواتب، قسائم، بدلات واستقطاعات، ومعالجة شهرية منظمة.",
      en: "Payroll runs, payslips, allowances, deductions, and structured monthly processing."
    },
    status: "live",
    commercialTier: "core",
    availability: ["business", "enterprise"],
    evidencePaths: ["/dashboard/payroll", "/dashboard/payslips"],
    owner: "Payroll"
  },
  {
    id: "payroll.gosi-wps",
    family: "payroll-compliance",
    name: { ar: "WPS و GOSI والامتثال السعودي", en: "WPS, GOSI, and Saudi compliance" },
    summary: {
      ar: "تصدير WPS وإعدادات التأمينات كأساس امتثال سعودي قابل للبيع.",
      en: "WPS exports and GOSI configuration as a sellable Saudi compliance foundation."
    },
    status: "live",
    commercialTier: "core",
    availability: ["business", "enterprise"],
    evidencePaths: [
      "/dashboard/payroll",
      "app/api/payroll/settings/gosi/route.ts",
      "app/api/payroll/periods/[id]/bank-file/route.ts",
      "lib/gosi.ts"
    ],
    owner: "Payroll Compliance"
  },
  {
    id: "mobile.employee-experience",
    family: "mobile",
    name: { ar: "تجربة الموظف على الجوال", en: "Employee mobile experience" },
    summary: {
      ar: "حضور، طلبات، قسائم راتب، وإشعارات ضمن تطبيق موظف فعلي.",
      en: "Attendance, requests, payslips, and notifications in a real employee mobile app."
    },
    status: "live",
    commercialTier: "core",
    availability: ["starter", "business", "enterprise"],
    evidencePaths: ["apps/mobile/app/(tabs)", "/m"],
    owner: "Mobile"
  },
  {
    id: "recruitment.company-careers-portal",
    family: "recruitment",
    name: { ar: "بوابة التوظيف وبورتال الوظائف", en: "Careers portal and recruiting surface" },
    summary: {
      ar: "بوابة وظائف عامة وصفحات مخصصة للشركات ومسار نشر/تقديم متصل.",
      en: "A shared public careers portal, dedicated company pages, and connected publishing/application flows."
    },
    status: "live",
    commercialTier: "differentiator",
    availability: ["business", "enterprise"],
    evidencePaths: ["/careers", "/dashboard/job-postings", "/dashboard/applicants"],
    owner: "Recruitment"
  },
  {
    id: "analytics.operational-insights",
    family: "analytics",
    name: { ar: "التحليلات والتقارير التشغيلية", en: "Operational analytics and reporting" },
    summary: {
      ar: "لوحات تشغيلية وتقارير تساعد الإدارة وHR على المتابعة واتخاذ القرار.",
      en: "Operational dashboards and reports for HR and leadership follow-up and decision-making."
    },
    status: "live",
    commercialTier: "advanced",
    availability: ["business", "enterprise"],
    evidencePaths: ["/dashboard/analytics", "/dashboard/reports"],
    owner: "Analytics"
  },
  {
    id: "platform.bilingual-experience",
    family: "platform",
    name: { ar: "تجربة عربية / إنجليزية", en: "Arabic / English experience" },
    summary: {
      ar: "واجهة ثنائية اللغة مع دعم RTL/LTR متسق عبر التشغيل اليومي.",
      en: "A bilingual experience with consistent RTL/LTR support across daily operations."
    },
    status: "live",
    commercialTier: "core",
    availability: ["starter", "business", "enterprise"],
    evidencePaths: ["/", "/dashboard", "apps/mobile"],
    owner: "Platform UX"
  },
  {
    id: "platform.multi-tenant-workspaces",
    family: "platform",
    name: { ar: "مساحات تشغيل متعددة الشركات", en: "Multi-tenant workspaces" },
    summary: {
      ar: "كل شركة تعمل في مساحة مستقلة مع عزل وصلاحيات وسياق خاص بها.",
      en: "Each company runs in an isolated workspace with dedicated context and access control."
    },
    status: "live",
    commercialTier: "advanced",
    availability: ["starter", "business", "enterprise"],
    evidencePaths: ["proxy.ts", "/dashboard/super-admin/tenants", "lib/tenant.ts"],
    owner: "Platform"
  },
  {
    id: "platform.guided-activation",
    family: "platform",
    name: { ar: "تفعيل وتشغيل موجه", en: "Guided activation and rollout" },
    summary: {
      ar: "مسار تفعيل منظم يربط الطلب، الموافقة، وتجهيز الشركة قبل الإطلاق الفعلي.",
      en: "A structured activation path connecting request intake, approval, and workspace setup before launch."
    },
    status: "live",
    commercialTier: "advanced",
    availability: ["starter", "business", "enterprise"],
    evidencePaths: [
      "/request-demo",
      "/register",
      "/dashboard/super-admin/requests",
      "/dashboard/super-admin/tenants/new"
    ],
    owner: "Commercial Ops"
  },
  {
    id: "platform.roles-audit-logs",
    family: "platform",
    name: { ar: "الصلاحيات وسجلات التدقيق", en: "Roles and audit logs" },
    summary: {
      ar: "صلاحيات مبنية على الأدوار مع سجل مراجعة للعمليات الحساسة داخل مساحة الشركة.",
      en: "Role-based access with audit trails for sensitive actions inside each tenant workspace."
    },
    status: "live",
    commercialTier: "advanced",
    availability: ["business", "enterprise"],
    evidencePaths: ["/dashboard/audit-logs", "/api/audit-logs"],
    owner: "Security & Compliance"
  },
  {
    id: "platform.data-import-export",
    family: "platform",
    name: { ar: "استيراد وتصدير البيانات", en: "Data import and export" },
    summary: {
      ar: "استيراد بيانات الموظفين عبر CSV/Excel مع تدفقات تصدير للتقارير تساعد في سرعة الإطلاق والتشغيل.",
      en: "CSV/Excel employee imports plus report exports that reduce friction during rollout and daily operations."
    },
    status: "live",
    commercialTier: "advanced",
    availability: ["starter", "business", "enterprise"],
    evidencePaths: ["/dashboard/import", "/dashboard/reports"],
    owner: "Platform"
  },
  {
    id: "analytics.reports-and-exports",
    family: "analytics",
    name: { ar: "التقارير والتصدير", en: "Reports and exports" },
    summary: {
      ar: "تقارير تشغيلية لموارد بشرية ورواتب وأداء مع إمكانيات تصدير تساعد على اتخاذ القرار.",
      en: "Operational HR, payroll, and performance reports with export options that support decision-making."
    },
    status: "beta",
    commercialTier: "advanced",
    availability: ["business", "enterprise"],
    evidencePaths: [
      "/dashboard/reports",
      "/dashboard/payroll-reports",
      "/dashboard/performance-reports"
    ],
    owner: "Analytics"
  },
  {
    id: "recruitment.applicant-tracking",
    family: "recruitment",
    name: { ar: "إدارة التوظيف والمتقدمين", en: "Recruitment pipeline and applicants" },
    summary: {
      ar: "نشر الوظائف، استقبال المتقدمين، إدارة المقابلات، وإصدار العروض ضمن مسار توظيف واحد.",
      en: "Job postings, applicant intake, interview coordination, and offers in a single hiring workflow."
    },
    status: "live",
    commercialTier: "advanced",
    availability: ["business", "enterprise"],
    evidencePaths: [
      "/dashboard/job-postings",
      "/dashboard/applicants",
      "/dashboard/interviews",
      "/dashboard/job-offers"
    ],
    owner: "Recruitment"
  },
  {
    id: "performance.employee-evaluations",
    family: "performance",
    name: { ar: "تقييمات الأداء", en: "Performance evaluations" },
    summary: {
      ar: "قوالب تقييم ودورات مراجعة وإدارة تقييمات الموظفين ضمن مسار أداء قابل للتشغيل.",
      en: "Evaluation templates, review cycles, and employee evaluations in an operational performance flow."
    },
    status: "beta",
    commercialTier: "advanced",
    availability: ["business", "enterprise"],
    evidencePaths: ["/dashboard/employee-evaluations", "/dashboard/evaluation-templates"],
    owner: "Performance"
  },
  {
    id: "performance.development-plans",
    family: "performance",
    name: { ar: "الأهداف وخطط التطوير", en: "Goals and development plans" },
    summary: {
      ar: "أهداف قابلة للمتابعة وخطط تطوير مرتبطة بالموظفين لتقوية النمو الداخلي.",
      en: "Trackable goals and development plans tied to employees to support internal growth."
    },
    status: "beta",
    commercialTier: "advanced",
    availability: ["business", "enterprise"],
    evidencePaths: ["/dashboard/development-plans", "/api/performance/goals"],
    owner: "Performance"
  },
  {
    id: "learning.training-academy",
    family: "learning",
    name: { ar: "الأكاديمية والتدريب", en: "Training and academy" },
    summary: {
      ar: "إدارة الدورات والتسجيلات ومتابعة الإتمام داخل مسار تدريب مرتبط بالموظف.",
      en: "Manage courses, enrollments, and completion tracking in a training flow linked to employees."
    },
    status: "beta",
    commercialTier: "advanced",
    availability: ["business", "enterprise"],
    evidencePaths: ["/dashboard/training-courses", "/api/training/courses"],
    owner: "Learning"
  }
]);

export const defaultCommercialClaimsRegistry = commercialClaimSchema.array().parse([
  {
    id: "home.hero.saudi-hr-platform",
    surface: "home.hero",
    slot: "primary",
    title: {
      ar: "منصة موارد بشرية ورواتب وحضور مهيأة للسوق السعودي",
      en: "HR, payroll, and attendance built for the Saudi market"
    },
    description: {
      ar: "يرتبط هذا claim مباشرة بقدرات Core HR والرواتب والامتثال السعودي والجوال.",
      en: "This claim is directly backed by Core HR, payroll, Saudi compliance, and mobile capabilities."
    },
    linkedFeatureIds: [
      "core-hr.employee-management",
      "payroll.saudi-payroll",
      "payroll.gosi-wps",
      "mobile.employee-experience"
    ],
    strength: "core",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "home.feature-grid.employee-management",
    surface: "home.feature-grid",
    slot: "employee-management",
    title: { ar: "إدارة الموظفين", en: "Employee management" },
    description: {
      ar: "النسخة المختصرة التجارية لميزة إدارة الموظفين والهيكل التنظيمي.",
      en: "Commercial short-form copy for employee management and org structure."
    },
    linkedFeatureIds: ["core-hr.employee-management"],
    strength: "core",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "home.feature-grid.saudi-compliance",
    surface: "home.feature-grid",
    slot: "saudi-compliance",
    title: { ar: "الامتثال السعودي", en: "Saudi compliance" },
    description: {
      ar: "Claim خاص بربط WPS وGOSI وما يرتبط بهما من packaging سعودي.",
      en: "Claim used for WPS, GOSI, and Saudi compliance positioning."
    },
    linkedFeatureIds: ["payroll.gosi-wps"],
    strength: "core",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "home.feature-grid.time-attendance",
    surface: "home.feature-grid",
    slot: "time-attendance",
    title: { ar: "الحضور والانصراف", en: "Time & attendance" },
    description: {
      ar: "تتبع الحضور، الورديات، والغياب بشكل يومي واضح ومنظم.",
      en: "Track attendance, shifts, and absences through a clear daily operating flow."
    },
    linkedFeatureIds: ["attendance.time-and-attendance"],
    strength: "core",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "home.feature-grid.payroll-management",
    surface: "home.feature-grid",
    slot: "payroll-management",
    title: { ar: "إدارة الرواتب", en: "Payroll management" },
    description: {
      ar: "مسيرات، قسائم، واستحقاقات شهرية ضمن مسار رواتب واضح وقابل للتشغيل.",
      en: "Payroll runs, payslips, and monthly entitlements in an operationally clear flow."
    },
    linkedFeatureIds: ["payroll.saudi-payroll"],
    strength: "core",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "home.feature-grid.bilingual-experience",
    surface: "home.feature-grid",
    slot: "bilingual-experience",
    title: { ar: "عربي / إنجليزي", en: "Arabic & English" },
    description: {
      ar: "واجهة متسقة بالعربية والإنجليزية بدل ترجمة ملحقة فوق النظام.",
      en: "A consistent Arabic and English experience instead of translation layered on top."
    },
    linkedFeatureIds: ["platform.bilingual-experience"],
    strength: "supporting",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "home.feature-grid.multi-tenant",
    surface: "home.feature-grid",
    slot: "multi-tenant",
    title: { ar: "متعدد الشركات", en: "Multi-tenant" },
    description: {
      ar: "كل شركة تعمل في مساحة مستقلة وآمنة مع صلاحيات وسياق منفصل.",
      en: "Each company operates in a secure isolated workspace with its own access context."
    },
    linkedFeatureIds: ["platform.multi-tenant-workspaces"],
    strength: "supporting",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "home.feature-grid.analytics",
    surface: "home.feature-grid",
    slot: "analytics",
    title: { ar: "التقارير والتحليلات", en: "Reports & analytics" },
    description: {
      ar: "لوحات تشغيلية وتقارير تدعم المتابعة واتخاذ القرار للإدارة وHR.",
      en: "Operational dashboards and reports that support follow-up and decision making."
    },
    linkedFeatureIds: ["analytics.operational-insights"],
    strength: "supporting",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "home.feature-grid.leave-management",
    surface: "home.feature-grid",
    slot: "leave-management",
    title: { ar: "إدارة الإجازات", en: "Leave management" },
    description: {
      ar: "طلبات، أرصدة، وموافقات أساسية ضمن تجربة خدمة ذاتية أوضح للموظف والمدير.",
      en: "Requests, balances, and approval flows in a clearer self-service experience for employees and managers."
    },
    linkedFeatureIds: ["attendance.leave-management"],
    strength: "core",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "home.trust-items.guided-activation",
    surface: "home.trust-items",
    slot: "guided-activation",
    title: { ar: "تفعيل موجه من البداية", en: "Guided activation from day one" },
    description: {
      ar: "إطلاق منظم يمر على الطلب، الموافقة، وتجهيز الشركة قبل التشغيل الفعلي.",
      en: "A structured launch path through request review, approval, and workspace preparation before go-live."
    },
    linkedFeatureIds: ["platform.guided-activation"],
    strength: "supporting",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "home.trust-items.secure-workspaces",
    surface: "home.trust-items",
    slot: "secure-workspaces",
    title: { ar: "مساحات شركات معزولة", en: "Isolated company workspaces" },
    description: {
      ar: "كل شركة تعمل في مساحة مستقلة بصلاحيات وسياق تشغيل منفصلين.",
      en: "Each company runs in an isolated workspace with separate access and operating context."
    },
    linkedFeatureIds: ["platform.multi-tenant-workspaces"],
    strength: "supporting",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "home.trust-items.saudi-operations",
    surface: "home.trust-items",
    slot: "saudi-operations",
    title: { ar: "مسار رواتب وامتثال سعودي", en: "Saudi payroll and compliance path" },
    description: {
      ar: "الرواتب وWPS وGOSI ضمن مسار تشغيلي واحد قابل للبيع والتشغيل.",
      en: "Payroll, WPS, and GOSI sit in one operational path that is both sellable and usable."
    },
    linkedFeatureIds: ["payroll.saudi-payroll", "payroll.gosi-wps"],
    strength: "supporting",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "home.proof-pills.bilingual-operations",
    surface: "home.proof-pills",
    slot: "bilingual-operations",
    title: { ar: "تشغيل عربي / إنجليزي كامل", en: "Full Arabic / English operations" },
    description: {
      ar: "تجربة يومية متسقة بالعربية والإنجليزية عبر الويب والجوال.",
      en: "A consistent daily operating experience in Arabic and English across web and mobile."
    },
    linkedFeatureIds: ["platform.bilingual-experience"],
    strength: "supporting",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "home.proof-pills.unified-operations",
    surface: "home.proof-pills",
    slot: "unified-operations",
    title: {
      ar: "الموظفون والحضور والرواتب في مكان واحد",
      en: "Employees, attendance, and payroll in one place"
    },
    description: {
      ar: "تشغيل موحد بدل التنقل بين أدوات منفصلة لكل وظيفة أساسية.",
      en: "One operating flow instead of switching between separate tools for core work."
    },
    linkedFeatureIds: [
      "core-hr.employee-management",
      "attendance.time-and-attendance",
      "payroll.saudi-payroll"
    ],
    strength: "core",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "home.proof-pills.web-mobile",
    surface: "home.proof-pills",
    slot: "web-mobile",
    title: { ar: "ويب + جوال للإدارة والموظفين", en: "Web + mobile for admins and employees" },
    description: {
      ar: "تجربة تشغيل تربط الإدارة المكتبية بالاستخدام اليومي من الجوال.",
      en: "An operating experience that connects desktop admin work with daily mobile use."
    },
    linkedFeatureIds: ["mobile.employee-experience", "core-hr.employee-management"],
    strength: "supporting",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "home.proof-strip.unified-operations",
    surface: "home.proof-strip",
    slot: "unified-operations",
    title: { ar: "تشغيل موحد", en: "Unified operations" },
    description: {
      ar: "الموظفون والحضور والرواتب في نفس المسار بدل التنقل بين أدوات منفصلة.",
      en: "Employees, attendance, and payroll stay in one flow instead of separate tools."
    },
    linkedFeatureIds: [
      "core-hr.employee-management",
      "attendance.time-and-attendance",
      "payroll.saudi-payroll"
    ],
    strength: "core",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "home.proof-strip.arabic-first",
    surface: "home.proof-strip",
    slot: "arabic-first",
    title: { ar: "واجهة عربية أصلية", en: "Arabic-first experience" },
    description: {
      ar: "تجربة RTL كاملة مع نسخة إنجليزية جاهزة للإدارة والموظفين.",
      en: "Full RTL experience with an English-ready flow for admins and employees."
    },
    linkedFeatureIds: ["platform.bilingual-experience"],
    strength: "supporting",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "home.proof-strip.faster-adoption",
    surface: "home.proof-strip",
    slot: "faster-adoption",
    title: { ar: "اعتماد أسرع داخل الفريق", en: "Faster team adoption" },
    description: {
      ar: "نفس المنصة تغطي الإدارة المكتبية والجوال اليومي بدون تعقيد بصري زائد.",
      en: "The same product covers desktop admin work and daily mobile use without visual clutter."
    },
    linkedFeatureIds: ["mobile.employee-experience", "platform.guided-activation"],
    strength: "supporting",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "home.integrations.gosi-wps",
    surface: "home.integrations",
    slot: "saudi-integrations",
    title: { ar: "تكاملات الامتثال السعودي", en: "Saudi compliance integrations" },
    description: {
      ar: "إظهار GOSI/WPS كتأكيد بصري لعمق الامتثال لا كتكاملات مفتوحة بلا ضبط.",
      en: "Surface GOSI/WPS as visual proof of compliance depth, not as an unbounded integrations claim."
    },
    linkedFeatureIds: ["payroll.gosi-wps"],
    strength: "supporting",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "features.hero.badge",
    surface: "features.hero",
    slot: "badge",
    title: { ar: "وحدات الموارد البشرية الأساسية", en: "Core HR modules" },
    description: {
      ar: "شارة مختصرة لصفحة المميزات.",
      en: "A short badge label for the features page."
    },
    linkedFeatureIds: [
      "core-hr.employee-management",
      "attendance.time-and-attendance",
      "payroll.saudi-payroll",
      "mobile.employee-experience"
    ],
    strength: "supporting",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "features.hero.primary",
    surface: "features.hero",
    slot: "primary",
    title: { ar: "مميزات طاقم", en: "Taqam features" },
    description: {
      ar: "هذه الصفحة تعرض وحدات طاقم الرئيسية: بيانات الموظفين، الحضور، الرواتب، التقارير، والتوظيف — بشكل منظّم وواضح.",
      en: "This page lists Taqam's main modules: people data, attendance, payroll, reporting, and recruitment — organized and easy to scan."
    },
    linkedFeatureIds: [
      "core-hr.employee-management",
      "attendance.time-and-attendance",
      "payroll.saudi-payroll",
      "analytics.operational-insights",
      "recruitment.company-careers-portal"
    ],
    strength: "core",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "features.platform-anatomy.primary",
    surface: "features.platform-anatomy",
    slot: "primary",
    title: {
      ar: "منصة واحدة لمسارات تشغيل أساسية",
      en: "One platform for essential workflows"
    },
    description: {
      ar: "نرتّب المميزات حسب مسارات العمل حتى تعرف بسرعة ماذا يغطي النظام وكيف تُقسم الوحدات.",
      en: "Features are grouped by workflow so you can quickly see what's covered and how modules are organized."
    },
    linkedFeatureIds: [
      "core-hr.employee-management",
      "attendance.time-and-attendance",
      "payroll.saudi-payroll",
      "analytics.operational-insights",
      "recruitment.company-careers-portal"
    ],
    strength: "supporting",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "features.platform-highlights.faster-operations",
    surface: "features.platform-highlights",
    slot: "faster-operations",
    title: { ar: "تشغيل يومي أسرع", en: "Faster daily operations" },
    description: {
      ar: "تجميع خطوات العمل الأساسية في مكان واحد يقلل التكرار ويُسهّل المتابعة.",
      en: "Keeping core workflows in one place reduces duplication and makes follow-up easier."
    },
    linkedFeatureIds: [
      "core-hr.employee-management",
      "attendance.time-and-attendance",
      "payroll.saudi-payroll"
    ],
    strength: "supporting",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "features.platform-highlights.clear-compliance",
    surface: "features.platform-highlights",
    slot: "clear-compliance",
    title: { ar: "امتثال سعودي أوضح", en: "Clear Saudi compliance" },
    description: {
      ar: "تجميع الرواتب وWPS وسجلات التدقيق يساعد على متابعة الامتثال وتقليل الأخطاء.",
      en: "Keeping payroll, WPS, and audit trails together helps track compliance and reduce mistakes."
    },
    linkedFeatureIds: ["payroll.saudi-payroll", "payroll.gosi-wps"],
    strength: "supporting",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "features.platform-highlights.bilingual-ux",
    surface: "features.platform-highlights",
    slot: "bilingual-ux",
    title: { ar: "تجربة عربية/إنجليزية سليمة", en: "Solid Arabic and English UX" },
    description: {
      ar: "واجهة RTL/LTR متسقة بحيث لا يشعر المستخدم أن العربية طبقة مضافة فوق النظام.",
      en: "A consistent RTL/LTR experience so Arabic feels native, not layered on top of the product."
    },
    linkedFeatureIds: ["platform.bilingual-experience"],
    strength: "supporting",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "features.platform-highlights.executive-ux",
    surface: "features.platform-highlights",
    slot: "executive-ux",
    title: { ar: "واجهة تنفيذية أنظف", en: "Cleaner executive UX" },
    description: {
      ar: "تنظيم بصري يوضح ما يهم المدير التنفيذي، وما يهم HR، وما يخص الموظف نفسه.",
      en: "A visual structure that separates what matters to executives, HR teams, and employees."
    },
    linkedFeatureIds: ["analytics.operational-insights", "core-hr.employee-management"],
    strength: "supporting",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "pricing.plan-card.business",
    surface: "pricing.plan-card",
    slot: "business",
    title: { ar: "الأعمال", en: "Business" },
    description: {
      ar: "الباقة الأساسية القابلة للبيع لمعظم العملاء عندما تحتاج الرواتب والامتثال والتحليلات.",
      en: "The main commercial plan for most customers when payroll, compliance, and analytics are needed."
    },
    linkedFeatureIds: [
      "payroll.saudi-payroll",
      "payroll.gosi-wps",
      "analytics.operational-insights",
      "recruitment.company-careers-portal"
    ],
    strength: "core",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "careers.differentiator.portal",
    surface: "careers.differentiator",
    slot: "primary",
    title: { ar: "بوابة وظائف للمنصة", en: "Platform careers hub" },
    description: {
      ar: "صفحة تجمع الوظائف المفتوحة وتسهّل الوصول لصفحة كل شركة أو وظيفة.",
      en: "A page that aggregates open roles and links to each company or job page."
    },
    linkedFeatureIds: ["recruitment.company-careers-portal"],
    strength: "differentiator",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "careers.differentiator.company-portal",
    surface: "careers.differentiator",
    slot: "company-portal",
    title: { ar: "بوابة خاصة بكل شركة", en: "Dedicated portal per company" },
    description: {
      ar: "لكل شركة صفحة توظيف مستقلة يمكن مشاركتها مباشرة مع المرشحين على رابط خاص بها.",
      en: "Each company gets a dedicated careers portal that can be shared directly with candidates."
    },
    linkedFeatureIds: ["recruitment.company-careers-portal"],
    strength: "supporting",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "careers.differentiator.jobs-hub",
    surface: "careers.differentiator",
    slot: "jobs-hub",
    title: { ar: "مجمّع وظائف المنصة", en: "Platform-wide jobs hub" },
    description: {
      ar: "المرشح يرى كل الوظائف المفتوحة على مستوى المنصة ويصل منها مباشرة إلى صفحة كل وظيفة أو كل شركة.",
      en: "Candidates can browse all active openings across the platform and jump into either a job page or a company portal."
    },
    linkedFeatureIds: ["recruitment.company-careers-portal"],
    strength: "supporting",
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "careers.differentiator.integrated-applications",
    surface: "careers.differentiator",
    slot: "integrated-applications",
    title: { ar: "تقديم مباشر ومتكامل", en: "Direct integrated applications" },
    description: {
      ar: "أي طلب يصل مباشرة إلى قاعدة البيانات وإلى لوحة المتقدمين داخل الشركة المعنية مع إشعارات بريدية عند تفعيل SMTP.",
      en: "Every application lands directly in the database and the tenant's applicants dashboard, with optional email alerts when SMTP is enabled."
    },
    linkedFeatureIds: ["recruitment.company-careers-portal", "recruitment.applicant-tracking"],
    strength: "supporting",
    visibility: "public",
    statusGate: "live-only"
  }
]);

export const defaultMarketingIntegrationShowcase = marketingIntegrationShowcaseItemSchema
  .array()
  .parse([
    {
      id: "gosi",
      name: { ar: "GOSI", en: "GOSI" },
      description: { ar: "التأمينات الاجتماعية", en: "Social Insurance" },
      logoSrc: "/images/marketing/integrations/gosi.png",
      frameClassName: "bg-white p-4",
      imageClassName: "object-contain",
      availability: "live",
      linkedFeatureIds: ["payroll.gosi-wps"]
    },
    {
      id: "wps",
      name: { ar: "WPS", en: "WPS" },
      description: { ar: "نظام حماية الأجور", en: "Wage Protection System" },
      logoSrc: "/images/marketing/integrations/wps.jpg",
      frameClassName: "bg-white p-2",
      imageClassName: "object-contain",
      availability: "live",
      linkedFeatureIds: ["payroll.gosi-wps"]
    },
    {
      id: "mudad-enterprise",
      name: { ar: "مدد", en: "Mudad" },
      description: {
        ar: "تكامل يُجهّز للمؤسسات عند الطلب",
        en: "Enterprise integration on request"
      },
      logoSrc: "/images/marketing/integrations/mudad.png",
      frameClassName: "bg-white p-3",
      imageClassName: "object-contain",
      availability: "enterprise-custom",
      linkedFeatureIds: []
    },
    {
      id: "muqeem-enterprise",
      name: { ar: "مقيم", en: "Muqeem" },
      description: {
        ar: "تكامل يُجهّز للمؤسسات عند الطلب",
        en: "Enterprise integration on request"
      },
      logoSrc: "/images/marketing/integrations/muqeem.png",
      frameClassName: "bg-white p-3",
      imageClassName: "object-contain",
      availability: "enterprise-custom",
      linkedFeatureIds: []
    },
    {
      id: "sap-enterprise",
      name: { ar: "SAP", en: "SAP" },
      description: {
        ar: "تكامل يُجهّز للمؤسسات عند الطلب",
        en: "Enterprise integration on request"
      },
      logoSrc: "/images/marketing/integrations/sap.png",
      frameClassName: "bg-white p-3",
      imageClassName: "object-contain",
      availability: "enterprise-custom",
      linkedFeatureIds: []
    },
    {
      id: "mustafid-enterprise",
      name: { ar: "مستفيد", en: "Mustafid" },
      description: {
        ar: "تكامل يُجهّز للمؤسسات عند الطلب",
        en: "Enterprise integration on request"
      },
      logoSrc: "/images/marketing/integrations/mustafid.jpg",
      frameClassName: "bg-white p-2",
      imageClassName: "object-contain",
      availability: "enterprise-custom",
      linkedFeatureIds: []
    }
  ]);

export const defaultMarketingPersonaShowcase = marketingPersonaShowcaseItemSchema.array().parse([
  {
    id: "hr-manager",
    role: { ar: "مدير الموارد البشرية", en: "HR Manager" },
    title: {
      ar: "تحكم كامل في الهيكل التنظيمي والرواتب",
      en: "Full control of org structure and payroll"
    },
    description: {
      ar: "أدر ملفات الموظفين ومسير الرواتب والإجازات من لوحة تحكم واحدة متكاملة.",
      en: "Manage employee files, payroll, and leaves from one integrated dashboard."
    },
    visualCaption: {
      ar: "ملفات الموظفين والموافقات والرواتب في مشهد واحد واضح لفريق الموارد البشرية.",
      en: "Employee records, approvals, and payroll sit together in one clear HR workspace."
    },
    highlights: [
      {
        ar: "مسير رواتب تلقائي متوافق مع GOSI",
        en: "Automated payroll with GOSI compliance"
      },
      {
        ar: "موافقة فورية على الإجازات والطلبات",
        en: "Instant leave and request approvals"
      },
      {
        ar: "تقارير HR قابلة للتصدير",
        en: "Exportable HR reports"
      }
    ],
    linkedFeatureIds: [
      "core-hr.employee-management",
      "payroll.saudi-payroll",
      "payroll.gosi-wps",
      "attendance.leave-management",
      "analytics.operational-insights"
    ]
  },
  {
    id: "executive",
    role: { ar: "المدير التنفيذي", en: "CEO / Finance" },
    title: {
      ar: "رؤية تنفيذية شاملة لكل المؤشرات",
      en: "Complete executive visibility of all KPIs"
    },
    description: {
      ar: "تابع أداء الفريق ومؤشرات الامتثال والتكاليف من لوحة بيانات تنفيذية لحظية.",
      en: "Monitor team performance, compliance, and costs from a real-time executive dashboard."
    },
    visualCaption: {
      ar: "لوحات تنفيذية وتقارير وتحليلات لحظية تساعد الإدارة على اتخاذ القرار بسرعة.",
      en: "Executive dashboards, reports, and live analytics help leadership make faster decisions."
    },
    highlights: [
      {
        ar: "لوحات بيانات تنفيذية لحظية",
        en: "Real-time executive dashboards"
      },
      {
        ar: "تقارير التكاليف والامتثال للوائح",
        en: "Cost and regulatory compliance reports"
      },
      {
        ar: "تنبيهات ذكية للمواعيد والمستحقات",
        en: "Smart deadline and entitlement alerts"
      }
    ],
    linkedFeatureIds: ["analytics.operational-insights", "payroll.gosi-wps"]
  },
  {
    id: "employee",
    role: { ar: "الموظف", en: "Employee" },
    title: {
      ar: "كل ما تحتاجه من جوالك مباشرةً",
      en: "Everything you need from your phone"
    },
    description: {
      ar: "سجّل حضورك واطلب إجازتك وراجع قسيمة راتبك من تطبيق طاقم.",
      en: "Clock in, request leave, and view your payslip from the Taqam mobile app."
    },
    visualCaption: {
      ar: "مسار يومي واضح للموظف: حضور، طلبات، ورواتب من شاشة جوال واحدة.",
      en: "A clear daily employee flow: attendance, requests, and payroll from one mobile screen."
    },
    highlights: [
      {
        ar: "تسجيل الحضور والانصراف بسهولة",
        en: "Easy attendance check-in and check-out"
      },
      {
        ar: "طلبات الإجازة ومتابعة الرصيد",
        en: "Leave requests with balance tracking"
      },
      {
        ar: "قسيمة الراتب والمستحقات",
        en: "Payslip and entitlements view"
      }
    ],
    linkedFeatureIds: [
      "mobile.employee-experience",
      "attendance.time-and-attendance",
      "attendance.leave-management",
      "payroll.saudi-payroll"
    ]
  }
]);

export const defaultMarketingTestimonials = marketingTestimonialSchema.array().parse([
  {
    id: "payroll-speed",
    quote: {
      ar: "طاقم غيّر طريقة إدارة رواتبنا تماماً. مسير الرواتب الذي كان يستغرق ٣ أيام بات يتم في أقل من ساعة.",
      en: "Taqam completely changed how we manage payroll. What used to take 3 days now takes less than an hour."
    },
    name: { ar: "سارة الشهراني", en: "Sarah Al-Shahrani" },
    role: {
      ar: "مدير الموارد البشرية — شركة الباحة للمقاولات",
      en: "HR Manager — Al-Baha Contracting Co."
    },
    avatarSrc: "/images/marketing/testimonials/sarah.jpg",
    linkedFeatureIds: ["payroll.saudi-payroll"],
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "saudi-compliance-flow",
    quote: {
      ar: "التكامل مع GOSI وWPS وفّر علينا ساعات من العمل اليدوي شهرياً. الدعم الفني متاح دائماً وباحترافية عالية.",
      en: "Integration with GOSI and WPS saved us hours of manual work monthly. Support is always professional."
    },
    name: { ar: "نورة الغامدي", en: "Noura Al-Ghamdi" },
    role: {
      ar: "مديرة شؤون الموظفين — مجموعة سدير التجارية",
      en: "People Director — Sudair Trading Group"
    },
    avatarSrc: "/images/marketing/testimonials/noura.jpg",
    linkedFeatureIds: ["payroll.gosi-wps", "payroll.saudi-payroll"],
    visibility: "public",
    statusGate: "live-only"
  },
  {
    id: "mobile-manager-visibility",
    quote: {
      ar: "أقدر أتابع حضور وإجازات فريقي كامل من جوالي في أي وقت. طاقم جعل حياتي كمدير أسهل بكثير.",
      en: "I can track my whole team's attendance and leaves from my phone at any time. Taqam made my life much easier."
    },
    name: { ar: "خالد العتيبي", en: "Khalid Al-Otaibi" },
    role: {
      ar: "المدير التنفيذي — مركز الخبر للتقنية",
      en: "CEO — Al-Khobar Tech Center"
    },
    avatarSrc: "/images/marketing/testimonials/khalid.jpg",
    linkedFeatureIds: ["mobile.employee-experience", "attendance.leave-management"],
    visibility: "public",
    statusGate: "live-only"
  }
]);

export const defaultMarketingFeatureSuites = marketingFeatureSuiteSchema.array().parse([
  {
    id: "core-hr",
    title: { ar: "الموارد البشرية الأساسية", en: "Core HR" },
    eyebrow: { ar: "قاعدة التشغيل", en: "Operational foundation" },
    summary: {
      ar: "كل ما يخص بيانات الموظفين وهيكل الشركة والتنبيهات الأساسية في طبقة تشغيل واحدة واضحة وسهلة الإدارة.",
      en: "Everything around employee records, company structure, and operational visibility in one clear foundation layer."
    },
    outcomes: [
      { ar: "ملفات موظفين كاملة وقابلة للتحديث", en: "Full employee records that stay up to date" },
      {
        ar: "هيكل إداري واضح بدل الجداول المتفرقة",
        en: "A clear org structure instead of scattered sheets"
      },
      {
        ar: "لوحة تحكم تُظهر ما يحتاجه الفريق يومياً",
        en: "A dashboard that surfaces what teams need every day"
      }
    ],
    items: [
      {
        id: "employee-management",
        icon: "users",
        title: { ar: "إدارة الموظفين", en: "Employee Management" },
        description: {
          ar: "ملف موظف شامل: بيانات شخصية، وظيفية، عقد، تاريخ التعيين، والحالة الوظيفية مع سهولة الوصول والتحديث.",
          en: "A full employee profile with personal data, job info, contract details, hire date, and current status."
        },
        linkedFeatureIds: ["core-hr.employee-management"]
      },
      {
        id: "org-structure",
        icon: "building2",
        title: { ar: "هيكل الشركة", en: "Org Structure" },
        description: {
          ar: "أقسام ومسميات وظيفية وورديات وتوزيع للموظفين في هيكل هرمي واضح يسهل متابعته عند النمو.",
          en: "Departments, job titles, shifts, and employee assignment in a hierarchy that remains clear as you scale."
        },
        linkedFeatureIds: ["core-hr.employee-management"]
      },
      {
        id: "dashboard",
        icon: "layoutDashboard",
        title: { ar: "لوحة التحكم", en: "Dashboard" },
        description: {
          ar: "نظرة شاملة على الحضور، الإجازات، الرواتب، والتنبيهات اليومية بدون الحاجة لفتح عدة صفحات في كل مرة.",
          en: "A single overview for attendance, leave, payroll, and daily alerts without opening multiple pages each time."
        },
        linkedFeatureIds: ["analytics.operational-insights", "core-hr.employee-management"]
      }
    ],
    sortOrder: 1
  },
  {
    id: "attendance",
    title: { ar: "الحضور والإجازات", en: "Attendance & Leave" },
    eyebrow: { ar: "الإيقاع اليومي للعمل", en: "The daily work rhythm" },
    summary: {
      ar: "إدارة الوقت لا تكون فعالة عندما تكون منفصلة عن الإجازات والطلبات. هنا المسار كله مربوط من الحضور إلى الموافقة إلى التقرير.",
      en: "Time management is weak when it is isolated from leave and approvals. Here the whole path is connected end to end."
    },
    outcomes: [
      {
        ar: "تتبع يومي واضح للحضور والتأخير",
        en: "Clear daily tracking for attendance and tardiness"
      },
      { ar: "طلبات إجازة بمسار موافقات مفهوم", en: "Leave requests with a clean approval flow" },
      {
        ar: "تجربة موبايل تخدم الموظف مباشرة",
        en: "A mobile experience that serves employees directly"
      }
    ],
    items: [
      {
        id: "time-attendance",
        icon: "clock",
        title: { ar: "الحضور والانصراف", en: "Time & Attendance" },
        description: {
          ar: "سجلات حضور دقيقة، ورديات مرنة، رصد التأخر والغياب، وتقارير يومية تعطي الفريق التشغيلي صورة دقيقة لحظة بلحظة.",
          en: "Accurate attendance logs, flexible shifts, tardiness tracking, and daily reports for a real operational view."
        },
        linkedFeatureIds: ["attendance.time-and-attendance"]
      },
      {
        id: "mobile-check-in",
        icon: "smartphone",
        title: { ar: "تسجيل حضور من الجوال", en: "Mobile Check-in" },
        description: {
          ar: "يسجّل الموظف حضوره وانصرافه من التطبيق مع قابلية ربطه بالموقع الجغرافي عند الحاجة دون تعقيد على المستخدم.",
          en: "Employees check in and out from mobile, with optional location verification when needed."
        },
        linkedFeatureIds: ["mobile.employee-experience", "attendance.time-and-attendance"]
      },
      {
        id: "leave-management",
        icon: "messageSquare",
        title: { ar: "إدارة الإجازات", en: "Leave Management" },
        description: {
          ar: "طلبات إجازة، موافقة أو رفض، أنواع متعددة من الإجازات، وأرصدة تُحتسب تلقائياً بدل المتابعة اليدوية.",
          en: "Leave requests, approval or rejection, multiple leave types, and balances that update automatically."
        },
        linkedFeatureIds: ["attendance.leave-management"]
      }
    ],
    sortOrder: 2
  },
  {
    id: "payroll",
    title: { ar: "الرواتب والمالية", en: "Payroll & Finance" },
    eyebrow: { ar: "المسار المالي", en: "The finance layer" },
    summary: {
      ar: "بدل أن تكون الرواتب مرحلة منفصلة ومرهقة، طاقم يحولها إلى مسار واضح من الإدخال إلى المراجعة إلى التصدير والإرسال.",
      en: "Instead of payroll being a separate painful cycle, Taqam turns it into a clear flow from input to approval to export."
    },
    outcomes: [
      { ar: "تشغيل مسير رواتب شهري أو دوري", en: "Run payroll monthly or on custom cycles" },
      { ar: "تصدير WPS وقسائم راتب احترافية", en: "WPS export and polished payslips" },
      {
        ar: "تقليل الأخطاء اليدوية في الاستحقاقات",
        en: "Reduce manual errors in entitlements and deductions"
      }
    ],
    items: [
      {
        id: "payroll-run",
        icon: "creditCard",
        title: { ar: "مسير الرواتب", en: "Payroll Run" },
        description: {
          ar: "تشغيل شهري أو دوري للرواتب مع استحقاقات واستقطاعات مرنة ومراجعة أو إقرار بسرعة قبل الإرسال النهائي.",
          en: "Run payroll on monthly or custom schedules with flexible allowances, deductions, and quick approval steps."
        },
        linkedFeatureIds: ["payroll.saudi-payroll"]
      },
      {
        id: "wps-export",
        icon: "fileDown",
        title: { ar: "تصدير WPS", en: "WPS Export" },
        description: {
          ar: "تصدير ملفات الرواتب بصيغة WPS المتوافقة مع متطلبات وزارة الموارد البشرية دون تحويلات يدوية إضافية.",
          en: "Export payroll files in WPS format aligned with Saudi labor requirements without extra manual steps."
        },
        linkedFeatureIds: ["payroll.gosi-wps"]
      },
      {
        id: "payslips",
        icon: "wallet",
        title: { ar: "كشوف الرواتب", en: "Payslips" },
        description: {
          ar: "قسائم راتب احترافية قابلة للطباعة والتحميل والإرسال للموظفين بشكل يليق بالعلامة ويقلل الأسئلة المتكررة.",
          en: "Professional payslips that can be printed, downloaded, and sent to employees in a cleaner branded format."
        },
        linkedFeatureIds: ["payroll.saudi-payroll", "mobile.employee-experience"]
      }
    ],
    sortOrder: 3
  },
  {
    id: "performance",
    title: { ar: "الأداء والتطوير", en: "Performance & Development" },
    eyebrow: { ar: "النمو الداخلي", en: "Internal growth" },
    summary: {
      ar: "المنصة لا يجب أن تتوقف عند التوظيف والرواتب. هذا المسار يحافظ على التطوير المهني وتقييم الأداء كجزء من التشغيل نفسه.",
      en: "The platform should not stop at payroll and records. This layer keeps growth and performance inside the operating system."
    },
    outcomes: [
      { ar: "دورات تقييم متكررة وواضحة", en: "Repeatable and structured review cycles" },
      {
        ar: "أهداف قابلة للمتابعة وليست شكلية",
        en: "Trackable goals that are not just ceremonial"
      },
      { ar: "برامج تدريب مرتبطة بحالة الموظف", en: "Training linked directly to employee progress" }
    ],
    items: [
      {
        id: "performance-reviews",
        icon: "star",
        title: { ar: "تقييم الأداء", en: "Performance Reviews" },
        description: {
          ar: "نماذج تقييم مخصصة ودورات تقييم دورية وتقارير تجعل مراجعة الأداء عملية يمكن البناء عليها لا مجرد إجراء سنوي.",
          en: "Custom review templates, recurring evaluation cycles, and reports that make performance review actionable."
        },
        linkedFeatureIds: ["performance.employee-evaluations"],
        statusGate: "allow-beta"
      },
      {
        id: "goals-development",
        icon: "target",
        title: { ar: "الأهداف وخطط التطوير", en: "Goals & Development Plans" },
        description: {
          ar: "تحديد أهداف لكل موظف وربطها بخطط تطوير ومتابعة نسب التقدم من داخل النظام نفسه.",
          en: "Set goals per employee, link them to development plans, and track progress from within the platform."
        },
        linkedFeatureIds: ["performance.development-plans"],
        statusGate: "allow-beta"
      },
      {
        id: "training-academy",
        icon: "graduationCap",
        title: { ar: "التدريب والأكاديمية", en: "Training & Academy" },
        description: {
          ar: "إدارة برامج التدريب والتسجيل في الدورات ومتابعة إتمام الموظفين للمواد التدريبية بصورة منظمة.",
          en: "Manage training programs, enrollments, and completion tracking with a structured learning flow."
        },
        linkedFeatureIds: ["learning.training-academy"],
        statusGate: "allow-beta"
      }
    ],
    sortOrder: 4
  },
  {
    id: "recruitment",
    title: { ar: "التوظيف", en: "Recruitment" },
    eyebrow: { ar: "بوابة النمو", en: "Growth entry point" },
    summary: {
      ar: "التوظيف ليس مجرد نشر إعلان. طاقم يجمع الإعلان والمتقدمين والمقابلات والعروض في مسار واحد مفهوم للفريق.",
      en: "Recruitment is more than publishing a job post. Taqam keeps postings, applicants, interviews, and offers in one path."
    },
    outcomes: [
      {
        ar: "إعلان وظيفة ومتابعة المتقدمين من مكان واحد",
        en: "Job posting and applicant tracking in one place"
      },
      { ar: "تقليل الفوضى بين البريد والملفات", en: "Reduce chaos across email and manual files" },
      {
        ar: "تحويل المرشح إلى موظف دون فقدان السياق",
        en: "Move candidates into onboarding without losing context"
      }
    ],
    items: [
      {
        id: "job-postings",
        icon: "bookOpen",
        title: { ar: "إعلانات الوظائف", en: "Job Postings" },
        description: {
          ar: "نشر إعلانات الوظائف وإدارة المسارات المفتوحة بسهولة مع رؤية واضحة لحالة كل فرصة توظيف.",
          en: "Publish and manage job openings with clearer visibility into each recruitment pipeline."
        },
        linkedFeatureIds: ["recruitment.applicant-tracking", "recruitment.company-careers-portal"]
      },
      {
        id: "interviews",
        icon: "users",
        title: { ar: "إدارة المقابلات", en: "Interview Management" },
        description: {
          ar: "جدولة المقابلات وتسجيل الملاحظات وإصدار عروض العمل مباشرةً دون الاعتماد على مسارات خارجية مشتتة.",
          en: "Schedule interviews, capture notes, and issue offers directly instead of relying on external fragmented flows."
        },
        linkedFeatureIds: ["recruitment.applicant-tracking"]
      }
    ],
    sortOrder: 5
  },
  {
    id: "reports-compliance",
    title: { ar: "التقارير والامتثال", en: "Reports & Compliance" },
    eyebrow: { ar: "طبقة القرار والحوكمة", en: "Decision and governance layer" },
    summary: {
      ar: "حتى أفضل العمليات تفقد قيمتها إذا لم تكن قابلة للقياس. هذا المسار يعطي الإدارة والتشغيل نظرة قابلة للفهم والتنفيذ.",
      en: "Even great operations lose value if they cannot be measured. This layer makes the system observable and governable."
    },
    outcomes: [
      {
        ar: "تقارير موارد بشرية ورواتب في مكان واحد",
        en: "HR and payroll reporting from one surface"
      },
      { ar: "سجلات تدقيق وصلاحيات واضحة", en: "Clear permissions and audit trails" },
      { ar: "استيراد وتصدير منظم للبيانات", en: "Structured import and export workflows" }
    ],
    items: [
      {
        id: "hr-reports",
        icon: "barChart3",
        title: { ar: "تقارير HR متعددة", en: "HR Reports" },
        description: {
          ar: "تقارير حضور وإجازات ورواتب ودوران عمالة وتكاليف في صفحة منظمة تساعدك على التحليل بدلاً من جمع البيانات أولاً.",
          en: "Attendance, leave, payroll, turnover, and cost reports organized for analysis instead of manual aggregation."
        },
        linkedFeatureIds: ["analytics.reports-and-exports"],
        statusGate: "allow-beta"
      },
      {
        id: "payroll-reports",
        icon: "trendingUp",
        title: { ar: "تقارير الرواتب", en: "Payroll Reports" },
        description: {
          ar: "تحليلات مفصّلة لتكاليف الرواتب والمكافآت والاستقطاعات مع مقارنة الفترات وإظهار الاتجاهات المهمة بسرعة.",
          en: "Detailed payroll analysis across salaries, bonuses, deductions, and period comparisons with faster signal detection."
        },
        linkedFeatureIds: ["analytics.reports-and-exports", "payroll.saudi-payroll"],
        statusGate: "allow-beta"
      },
      {
        id: "audit-logs",
        icon: "shield",
        title: { ar: "الأدوار وسجلات التدقيق", en: "Roles & Audit Logs" },
        description: {
          ar: "صلاحيات دقيقة لكل مستخدم مع سجل كامل للعمليات الحساسة بما يعطي الإدارة ثقة وتشغيلاً يمكن مراجعته.",
          en: "Fine-grained permissions with a full trail of sensitive actions for better trust and operational reviewability."
        },
        linkedFeatureIds: ["platform.roles-audit-logs"]
      },
      {
        id: "import-export",
        icon: "fileSpreadsheet",
        title: { ar: "استيراد وتصدير Excel", en: "Excel Import & Export" },
        description: {
          ar: "استيراد بيانات الموظفين من Excel/CSV وتصدير التقارير بسهولة بحيث يكون الانتقال إلى النظام أقل احتكاكاً.",
          en: "Import employee data from Excel/CSV, then export reports with less friction during rollout and daily usage."
        },
        linkedFeatureIds: ["platform.data-import-export"]
      },
      {
        id: "bilingual",
        icon: "globe",
        title: { ar: "عربي / إنجليزي بالكامل", en: "Full Arabic / English" },
        description: {
          ar: "واجهة كاملة بالعربية مع دعم RTL وتبديل فوري للإنجليزية، بدون شعور بأن أحد اللغتين أقل جودة من الأخرى.",
          en: "A full Arabic UI with RTL support and instant English switching, without one locale feeling secondary."
        },
        linkedFeatureIds: ["platform.bilingual-experience"]
      }
    ],
    sortOrder: 6
  }
]);

export function getCommercialFeatureCatalog(): CommercialFeature[] {
  return defaultCommercialFeatureCatalog;
}

export function getCommercialClaimsRegistry(): CommercialClaim[] {
  return defaultCommercialClaimsRegistry;
}

export function getCommercialClaimsBySurface(surface: CommercialClaimSurface): CommercialClaim[] {
  return defaultCommercialClaimsRegistry.filter((claim) => claim.surface === surface);
}

export function getMarketingIntegrationShowcase(
  availability?: MarketingIntegrationShowcaseItem["availability"]
): MarketingIntegrationShowcaseItem[] {
  if (!availability) {
    return defaultMarketingIntegrationShowcase;
  }

  return defaultMarketingIntegrationShowcase.filter((item) => item.availability === availability);
}

export function getMarketingPersonaShowcase(): MarketingPersonaShowcaseItem[] {
  return defaultMarketingPersonaShowcase;
}

export function getMarketingTestimonials(): MarketingTestimonial[] {
  return defaultMarketingTestimonials;
}

export function getMarketingFeatureSuites(): MarketingFeatureSuite[] {
  return defaultMarketingFeatureSuites;
}