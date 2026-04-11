// نظام الإعدادات المتقدمة - Advanced Settings System

// ==================== إعدادات النظام العامة ====================

export interface SystemSettings {
  general: GeneralSettings;
  localization: LocalizationSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
  backup: BackupSettings;
}

export interface GeneralSettings {
  companyName: string;
  companyNameEn?: string;
  companyLogo?: string;
  timezone: string;
  dateFormat: string;
  timeFormat: "12h" | "24h";
  currency: string;
  fiscalYearStart: string; // MM-DD
  weekStartDay: 0 | 1 | 5 | 6; // 0=Sunday, 1=Monday, 5=Friday, 6=Saturday
}

export interface LocalizationSettings {
  defaultLanguage: "ar" | "en";
  supportedLanguages: ("ar" | "en")[];
  direction: "rtl" | "ltr";
  numberFormat: string;
  calendarType: "gregorian" | "hijri" | "both";
}

export interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expiryDays: number;
    preventReuse: number;
  };
  sessionTimeout: number; // minutes
  maxLoginAttempts: number;
  twoFactorAuth: "disabled" | "optional" | "required";
  ipWhitelist: string[];
  auditLogging: boolean;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  defaultChannels: ("email" | "sms" | "push" | "in-app")[];
  digestFrequency: "immediate" | "hourly" | "daily" | "weekly";
}

export interface IntegrationSettings {
  gosi: GosiIntegration;
  mol: MolIntegration;
  muqeem: MuqeemIntegration;
  mudad: MudadIntegration;
  erpIntegrations: ERPIntegration[];
}

export interface GosiIntegration {
  enabled: boolean;
  subscriberNumber?: string;
  lastSync?: string;
  autoSync: boolean;
}

export interface MolIntegration {
  enabled: boolean;
  establishmentNumber?: string;
  lastSync?: string;
  autoSync: boolean;
}

export interface MuqeemIntegration {
  enabled: boolean;
  username?: string;
  lastSync?: string;
  autoSync: boolean;
}

export interface MudadIntegration {
  enabled: boolean;
  organizationId?: string;
  lastSync?: string;
  autoSync: boolean;
}

export interface ERPIntegration {
  id: string;
  name: string;
  type: "sap" | "oracle" | "odoo" | "custom";
  status: "connected" | "disconnected" | "error";
  lastSync?: string;
  config?: Record<string, unknown>;
}

export interface BackupSettings {
  autoBackup: boolean;
  frequency: "daily" | "weekly" | "monthly";
  retentionDays: number;
  includeAttachments: boolean;
  lastBackup?: string;
  nextBackup?: string;
}

// ==================== إعدادات الموارد البشرية ====================

export interface HRSettings {
  employment: EmploymentSettings;
  attendance: AttendanceSettings;
  leaves: LeaveSettings;
  payroll: PayrollSettings;
  performance: PerformanceSettings;
}

export interface EmploymentSettings {
  probationPeriod: number; // days
  noticePeriod: number; // days
  defaultWorkingDays: number[];
  defaultWorkingHours: number;
  overtimeRules: OvertimeRule[];
  endOfServiceFormula: "saudi-labor-law" | "custom";
}

export interface OvertimeRule {
  id: string;
  name: string;
  type: "weekday" | "weekend" | "holiday";
  multiplier: number;
  maxHours?: number;
}

export interface AttendanceSettings {
  checkInMethod: ("biometric" | "mobile" | "web" | "manual")[];
  gracePeroidMinutes: number;
  lateDeductionRules: LateDeductionRule[];
  autoCheckoutTime?: string;
  requireLocation: boolean;
  locationRadius?: number; // meters
}

export interface LateDeductionRule {
  id: string;
  fromMinutes: number;
  toMinutes: number;
  deductionType: "fixed" | "percentage" | "hourly";
  deductionValue: number;
}

export interface LeaveSettings {
  leaveTypes: LeaveTypeConfig[];
  accrualMethod: "monthly" | "yearly" | "custom";
  carryOverEnabled: boolean;
  maxCarryOverDays: number;
  encashmentEnabled: boolean;
  maxEncashmentDays: number;
  minAdvanceRequest: number; // days
  maxConsecutiveDays?: number;
}

export interface LeaveTypeConfig {
  id: string;
  name: string;
  nameEn: string;
  code: string;
  annualEntitlement: number;
  isPaid: boolean;
  requiresApproval: boolean;
  requiresAttachment: boolean;
  maxDaysPerRequest?: number;
  minNoticeDays: number;
  applicableGenders: ("male" | "female")[];
  isActive: boolean;
}

export interface PayrollSettings {
  paymentDay: number;
  paymentMethod: "bank-transfer" | "check" | "cash";
  salaryComponents: SalaryComponent[];
  deductionComponents: DeductionComponent[];
  taxSettings: TaxSettings;
  gosiSettings: GosiSettings;
}

export interface SalaryComponent {
  id: string;
  name: string;
  nameEn: string;
  code: string;
  type: "fixed" | "percentage" | "formula";
  value?: number;
  formula?: string;
  isTaxable: boolean;
  isGosiApplicable: boolean;
  isActive: boolean;
}

export interface DeductionComponent {
  id: string;
  name: string;
  nameEn: string;
  code: string;
  type: "fixed" | "percentage" | "formula";
  value?: number;
  formula?: string;
  isActive: boolean;
}

export interface TaxSettings {
  enabled: boolean;
  taxRates: { from: number; to: number; rate: number }[];
}

export interface GosiSettings {
  employeeContribution: number; // percentage
  employerContribution: number; // percentage
  maxSalary: number;
}

export interface PerformanceSettings {
  reviewCycles: ReviewCycleConfig[];
  ratingScale: RatingScaleConfig;
  goalCategories: string[];
  competencies: CompetencyConfig[];
}

export interface ReviewCycleConfig {
  id: string;
  name: string;
  frequency: "monthly" | "quarterly" | "semi-annual" | "annual";
  startMonth: number;
  selfAssessment: boolean;
  peerReview: boolean;
  managerReview: boolean;
}

export interface RatingScaleConfig {
  min: number;
  max: number;
  labels: { value: number; label: string; labelEn: string }[];
}

export interface CompetencyConfig {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  description?: string;
}

// ==================== إعدادات سير العمل ====================

export interface WorkflowSettings {
  approvalWorkflows: ApprovalWorkflow[];
  escalationRules: EscalationRule[];
  delegationEnabled: boolean;
}

export interface ApprovalWorkflow {
  id: string;
  name: string;
  type: "leave" | "expense" | "loan" | "overtime" | "document" | "general";
  steps: ApprovalStep[];
  isActive: boolean;
}

export interface ApprovalStep {
  id: string;
  order: number;
  approverType: "direct-manager" | "department-head" | "hr" | "specific-user" | "role";
  approverId?: string;
  roleId?: string;
  canSkip: boolean;
  autoApproveAfter?: number; // hours
}

export interface EscalationRule {
  id: string;
  workflowId: string;
  waitHours: number;
  escalateTo: "skip-level-manager" | "hr" | "specific-user";
  escalateToId?: string;
  notifyOriginal: boolean;
}

// ==================== الأدوار والصلاحيات ====================

export interface Role {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
  usersCount: number;
  createdAt: string;
}

export interface Permission {
  id: string;
  module: string;
  action: "view" | "create" | "edit" | "delete" | "approve" | "export" | "admin";
  granted: boolean;
}

export const moduleLabels: Record<string, string> = {
  dashboard: "لوحة التحكم",
  employees: "الموظفين",
  attendance: "الحضور والانصراف",
  leaves: "الإجازات",
  payroll: "الرواتب",
  recruitment: "التوظيف",
  performance: "الأداء",
  training: "التدريب",
  reports: "التقارير",
  settings: "الإعدادات"
};
