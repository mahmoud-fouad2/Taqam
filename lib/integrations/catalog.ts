/**
 * Integrations Catalog & Provider Registry
 * Defines all available integration providers, their modes, and commercial status.
 * Actual connection/credential data is in DB (IntegrationConnection model).
 */

export type IntegrationCategory =
  | "payroll-compliance"
  | "government"
  | "finance-erp"
  | "productivity"
  | "communication";

export type IntegrationAvailability =
  | "live" // Connected and tested; usable today
  | "enterprise-custom" // Available via a custom engagement
  | "coming-soon"; // On roadmap

export type CredentialField = {
  key: string;
  labelAr: string;
  type: "text" | "password" | "url";
  required: boolean;
  hint?: string;
};

export type IntegrationProviderDef = {
  key: string; // DB providerKey
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  logoPath: string | null; // relative to /public
  category: IntegrationCategory;
  availability: IntegrationAvailability;
  defaultMode: "NATIVE_API" | "EMBEDDED" | "MANUAL_BRIDGE" | "ENTERPRISE_CUSTOM";
  docsUrl?: string;
  credentialFields?: CredentialField[];
};

export const INTEGRATION_PROVIDERS: IntegrationProviderDef[] = [
  // ── Priority A: Saudi Compliance ─────────────────────────────────────────
  {
    key: "gosi",
    nameAr: "التأمينات الاجتماعية (GOSI)",
    nameEn: "GOSI",
    descriptionAr: "احتساب وتصدير اشتراكات التأمينات الاجتماعية تلقائياً عند إغلاق الرواتب",
    descriptionEn: "Auto-calculate and export GOSI contributions with every payroll close",
    logoPath: "/integrations/gosi.png",
    category: "payroll-compliance",
    availability: "live",
    defaultMode: "MANUAL_BRIDGE",
    credentialFields: [
      {
        key: "establishment_id",
        labelAr: "رقم المنشأة",
        type: "text",
        required: true,
        hint: "رقم تسجيل المنشأة في نظام التأمينات"
      },
      {
        key: "org_id",
        labelAr: "معرّف المنظمة (اختياري)",
        type: "text",
        required: false,
        hint: "إن وُجد في بوابة GOSI"
      }
    ]
  },
  {
    key: "wps",
    nameAr: "نظام حماية الأجور (WPS)",
    nameEn: "WPS",
    descriptionAr: "توليد ملف SIF وتصديره لبنوك الرواتب لضمان الامتثال لنظام حماية الأجور",
    descriptionEn: "Generate SIF files for compliant salary processing via Saudi banks",
    logoPath: "/integrations/wps.jpg",
    category: "payroll-compliance",
    availability: "live",
    defaultMode: "MANUAL_BRIDGE",
    credentialFields: [
      {
        key: "bank_code",
        labelAr: "رمز البنك",
        type: "text",
        required: true,
        hint: "رمز البنك المُستلِم لملفات SIF"
      },
      {
        key: "iban",
        labelAr: "الآيبان (اختياري)",
        type: "text",
        required: false,
        hint: "حساب الرواتب الرئيسي"
      }
    ]
  },
  {
    key: "mudad",
    nameAr: "منصة مدد",
    nameEn: "Mudad",
    descriptionAr: "تكامل مع منصة مدد لإدارة الرواتب ومتطلبات الموارد البشرية",
    descriptionEn: "Connect with Mudad platform for payroll and HR compliance management",
    logoPath: "/integrations/mudad.png",
    category: "payroll-compliance",
    availability: "enterprise-custom",
    defaultMode: "ENTERPRISE_CUSTOM"
  },
  {
    key: "muqeem",
    nameAr: "مقيم",
    nameEn: "Muqeem",
    descriptionAr: "إدارة تصاريح الإقامة ومتابعة المقيمين من العمالة الوافدة",
    descriptionEn: "Manage residency permits and track expat workforce via Muqeem",
    logoPath: null,
    category: "government",
    availability: "enterprise-custom",
    defaultMode: "ENTERPRISE_CUSTOM"
  },
  {
    key: "mol",
    nameAr: "وزارة الموارد البشرية",
    nameEn: "Ministry of Labour (MOL)",
    descriptionAr: "تكامل مع خدمات وزارة الموارد البشرية والتنمية الاجتماعية",
    descriptionEn: "Connect with Ministry of Labour and Social Development services",
    logoPath: null,
    category: "government",
    availability: "enterprise-custom",
    defaultMode: "ENTERPRISE_CUSTOM"
  },

  // ── Priority B: ERP / Finance ─────────────────────────────────────────────
  {
    key: "sap",
    nameAr: "SAP",
    nameEn: "SAP",
    descriptionAr: "مزامنة بيانات الموظفين والرواتب مع أنظمة SAP",
    descriptionEn: "Sync employee and payroll data with SAP systems",
    logoPath: null,
    category: "finance-erp",
    availability: "enterprise-custom",
    defaultMode: "ENTERPRISE_CUSTOM"
  },
  {
    key: "oracle",
    nameAr: "Oracle",
    nameEn: "Oracle",
    descriptionAr: "تكامل مع قواعد بيانات Oracle وأنظمة HCM",
    descriptionEn: "Integrate with Oracle HCM and databases",
    logoPath: null,
    category: "finance-erp",
    availability: "enterprise-custom",
    defaultMode: "ENTERPRISE_CUSTOM"
  },

  // ── Priority C: Productivity ───────────────────────────────────────────────
  {
    key: "google-workspace",
    nameAr: "Google Workspace",
    nameEn: "Google Workspace",
    descriptionAr: "مزامنة المستخدمين وتسجيل الدخول عبر حسابات Google",
    descriptionEn: "User sync and SSO via Google accounts",
    logoPath: null,
    category: "productivity",
    availability: "coming-soon",
    defaultMode: "EMBEDDED"
  },
  {
    key: "microsoft-365",
    nameAr: "Microsoft 365",
    nameEn: "Microsoft 365",
    descriptionAr: "ربط الفريق مع بيئة Microsoft وتسجيل الدخول الآمن",
    descriptionEn: "Team connectivity and secure SSO via Microsoft 365",
    logoPath: null,
    category: "productivity",
    availability: "coming-soon",
    defaultMode: "EMBEDDED"
  }
];

/** Quick lookup by key */
export function getIntegrationProvider(key: string): IntegrationProviderDef | undefined {
  return INTEGRATION_PROVIDERS.find((p) => p.key === key);
}

/** Filter by availability */
export function getLiveIntegrations(): IntegrationProviderDef[] {
  return INTEGRATION_PROVIDERS.filter((p) => p.availability === "live");
}

export function getEnterpriseIntegrations(): IntegrationProviderDef[] {
  return INTEGRATION_PROVIDERS.filter((p) => p.availability === "enterprise-custom");
}
