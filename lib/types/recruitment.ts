// نظام التوظيف والتعيين - Recruitment & Hiring System

// ==================== الوظائف الشاغرة ====================

export type JobStatus = "draft" | "active" | "filled" | "closed";

export const jobStatusLabels: Record<JobStatus, string> = {
  draft: "مسودة",
  active: "مفتوح",
  filled: "تم شغلها",
  closed: "مغلق"
};

export const jobStatusColors: Record<JobStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  active: "bg-green-100 text-green-800",
  filled: "bg-blue-100 text-blue-800",
  closed: "bg-red-100 text-red-800"
};

export type JobType = "full-time" | "part-time" | "contract" | "internship" | "temporary";

export const jobTypeLabels: Record<JobType, string> = {
  "full-time": "دوام كامل",
  "part-time": "دوام جزئي",
  contract: "عقد مؤقت",
  internship: "تدريب",
  temporary: "مؤقت"
};

export type ExperienceLevel = "entry" | "junior" | "mid" | "senior" | "lead" | "executive";

export const experienceLevelLabels: Record<ExperienceLevel, string> = {
  entry: "مبتدئ",
  junior: "مبتدئ+",
  mid: "متوسط",
  senior: "خبير",
  lead: "قائد فريق",
  executive: "تنفيذي"
};

export interface JobPosting {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  requirements: string[];
  requirementsEn?: string[];
  responsibilities: string[];
  responsibilitiesEn?: string[];
  departmentId: string;
  departmentName: string;
  jobTitleId?: string;
  location: string;
  locationEn?: string;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  showSalary: boolean;
  status: JobStatus;
  skills: string[];
  benefits: string[];
  openPositions: number;
  filledPositions: number;
  applicationDeadline?: string;
  postedDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== المتقدمين ====================

export type ApplicationStatus =
  | "new"
  | "screening"
  | "shortlisted"
  | "interview"
  | "offer"
  | "accepted"
  | "rejected"
  | "withdrawn";

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  new: "جديد",
  screening: "فرز",
  shortlisted: "قائمة مختصرة",
  interview: "مقابلة",
  offer: "عرض وظيفي",
  accepted: "مقبول",
  rejected: "مرفوض",
  withdrawn: "منسحب"
};

export const applicationStatusColors: Record<ApplicationStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  screening: "bg-purple-100 text-purple-800",
  shortlisted: "bg-indigo-100 text-indigo-800",
  interview: "bg-cyan-100 text-cyan-800",
  offer: "bg-green-100 text-green-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-gray-100 text-gray-800"
};

export type SourceChannel =
  | "website"
  | "career-portal"
  | "linkedin"
  | "indeed"
  | "referral"
  | "agency"
  | "social"
  | "direct"
  | "other";

export const sourceChannelLabels: Record<SourceChannel, string> = {
  website: "الموقع الإلكتروني",
  "career-portal": "بوابة التوظيف",
  linkedin: "لينكد إن",
  indeed: "إنديد",
  referral: "ترشيح موظف",
  agency: "وكالة توظيف",
  social: "وسائل التواصل",
  direct: "تقديم مباشر",
  other: "أخرى"
};

export interface Applicant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobPostingId: string;
  jobTitle: string;
  currentPosition?: string;
  currentCompany?: string;
  expectedSalary?: number;
  availableFrom?: string;
  yearsOfExperience?: number;
  education?: string;
  skills: string[];
  resumeUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  coverLetter?: string;
  source: SourceChannel;
  referredBy?: string;
  status: ApplicationStatus;
  rating?: number;
  notes?: string;
  appliedAt: string;
  updatedAt: string;
}

// ==================== المقابلات ====================

export type InterviewType = "phone" | "video" | "in-person" | "technical" | "hr" | "final";

export const interviewTypeLabels: Record<InterviewType, string> = {
  phone: "هاتفية",
  video: "فيديو",
  "in-person": "حضورية",
  technical: "تقنية",
  hr: "موارد بشرية",
  final: "نهائية"
};

export type InterviewStatus = "scheduled" | "completed" | "cancelled" | "no-show";

export const interviewStatusLabels: Record<InterviewStatus, string> = {
  scheduled: "مجدولة",
  completed: "مكتملة",
  cancelled: "ملغاة",
  "no-show": "لم يحضر"
};

export const interviewStatusColors: Record<InterviewStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
  "no-show": "bg-orange-100 text-orange-800"
};

export interface Interview {
  id: string;
  applicantId: string;
  applicantName: string;
  jobPostingId: string;
  jobTitle: string;
  type: InterviewType;
  status: InterviewStatus;
  scheduledDate: string;
  scheduledTime: string;
  duration: number; // minutes
  location?: string;
  meetingLink?: string;
  interviewers: InterviewerInfo[];
  feedback?: InterviewFeedback[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewerInfo {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface InterviewFeedback {
  interviewerId: string;
  interviewerName: string;
  overallRating: number; // 1-5
  strengths: string[];
  weaknesses: string[];
  recommendation: "strong-hire" | "hire" | "no-decision" | "no-hire" | "strong-no-hire";
  comments?: string;
  submittedAt: string;
}

export const recommendationLabels: Record<InterviewFeedback["recommendation"], string> = {
  "strong-hire": "توظيف قوي",
  hire: "توظيف",
  "no-decision": "بدون قرار",
  "no-hire": "عدم التوظيف",
  "strong-no-hire": "رفض قاطع"
};

export const recommendationColors: Record<InterviewFeedback["recommendation"], string> = {
  "strong-hire": "bg-emerald-100 text-emerald-800",
  hire: "bg-green-100 text-green-800",
  "no-decision": "bg-yellow-100 text-yellow-800",
  "no-hire": "bg-orange-100 text-orange-800",
  "strong-no-hire": "bg-red-100 text-red-800"
};

// ==================== العروض الوظيفية ====================

export type OfferStatus =
  | "draft"
  | "pending-approval"
  | "approved"
  | "sent"
  | "accepted"
  | "declined"
  | "expired"
  | "revoked";

export const offerStatusLabels: Record<OfferStatus, string> = {
  draft: "مسودة",
  "pending-approval": "بانتظار الموافقة",
  approved: "موافق عليه",
  sent: "تم الإرسال",
  accepted: "مقبول",
  declined: "مرفوض",
  expired: "منتهي الصلاحية",
  revoked: "ملغي"
};

export const offerStatusColors: Record<OfferStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  "pending-approval": "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  sent: "bg-purple-100 text-purple-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  expired: "bg-orange-100 text-orange-800",
  revoked: "bg-red-100 text-red-800"
};

export interface JobOffer {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  jobPostingId: string;
  jobTitle: string;
  departmentId: string;
  departmentName: string;
  offeredSalary: number;
  currency: string;
  jobType: JobType;
  startDate: string;
  probationPeriod?: number; // months
  benefits: OfferBenefit[];
  termsAndConditions?: string;
  status: OfferStatus;
  validUntil: string;
  approvers: OfferApprover[];
  sentAt?: string;
  respondedAt?: string;
  declineReason?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferBenefit {
  name: string;
  value?: string;
  description?: string;
}

export interface OfferApprover {
  id: string;
  name: string;
  role: string;
  status: "pending" | "approved" | "rejected";
  comments?: string;
  actionAt?: string;
}

// ==================== عملية الإلحاق ====================

export type OnboardingStatus = "not-started" | "in-progress" | "completed" | "delayed";

export const onboardingStatusLabels: Record<OnboardingStatus, string> = {
  "not-started": "لم يبدأ",
  "in-progress": "قيد التنفيذ",
  completed: "مكتمل",
  delayed: "متأخر"
};

export const onboardingStatusColors: Record<OnboardingStatus, string> = {
  "not-started": "bg-gray-100 text-gray-800",
  "in-progress": "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  delayed: "bg-red-100 text-red-800"
};

export interface OnboardingProcess {
  id: string;
  employeeId: string;
  employeeName: string;
  jobTitle: string;
  departmentName: string;
  startDate: string;
  mentor?: MentorInfo;
  status: OnboardingStatus;
  progress: number; // 0-100
  tasks: OnboardingTask[];
  documents: OnboardingDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface MentorInfo {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  email: string;
}

export interface OnboardingTask {
  id: string;
  title: string;
  titleEn?: string;
  description?: string;
  category: "documentation" | "training" | "system-access" | "equipment" | "introduction" | "other";
  assignedTo?: string;
  assignedToName?: string;
  dueDate: string;
  completedDate?: string;
  status: "pending" | "in-progress" | "completed" | "overdue";
  priority: "low" | "medium" | "high";
  notes?: string;
}

export const taskCategoryLabels: Record<OnboardingTask["category"], string> = {
  documentation: "المستندات",
  training: "التدريب",
  "system-access": "صلاحيات النظام",
  equipment: "المعدات",
  introduction: "التعريف",
  other: "أخرى"
};

export const taskStatusLabels: Record<OnboardingTask["status"], string> = {
  pending: "معلق",
  "in-progress": "قيد التنفيذ",
  completed: "مكتمل",
  overdue: "متأخر"
};

export interface OnboardingDocument {
  id: string;
  name: string;
  type: "required" | "optional";
  status: "pending" | "uploaded" | "approved" | "rejected";
  fileUrl?: string;
  uploadedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

// ==================== قوالب الإلحاق ====================

export interface OnboardingTemplate {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  departmentId?: string;
  departmentName?: string;
  jobTitleId?: string;
  jobTitleName?: string;
  isDefault: boolean;
  tasks: OnboardingTaskTemplate[];
  documents: OnboardingDocumentTemplate[];
  duration: number; // days
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingTaskTemplate {
  id: string;
  title: string;
  titleEn?: string;
  description?: string;
  category: OnboardingTask["category"];
  dayOffset: number; // أيام من تاريخ البدء
  assignTo: "employee" | "manager" | "hr" | "it" | "mentor";
  priority: OnboardingTask["priority"];
}

export interface OnboardingDocumentTemplate {
  id: string;
  name: string;
  nameEn?: string;
  type: "required" | "optional";
  description?: string;
}

// ==================== إحصائيات التوظيف ====================

export interface RecruitmentStats {
  totalJobPostings: number;
  activeJobPostings: number;
  totalApplications: number;
  newApplications: number;
  interviewsScheduled: number;
  offersExtended: number;
  hiredThisMonth: number;
  averageTimeToHire: number; // days
  applicationsBySource: { source: SourceChannel; count: number }[];
  applicationsByStatus: { status: ApplicationStatus; count: number }[];
  topSkillsInDemand: { skill: string; count: number }[];
  conversionRates: {
    applicationToInterview: number;
    interviewToOffer: number;
    offerToHire: number;
  };
}

export interface RecruitmentPipeline {
  stage: ApplicationStatus;
  count: number;
  percentage: number;
}

// ==================== فلاتر البحث ====================

export interface JobSearchFilters {
  query?: string;
  status?: JobStatus[];
  departmentId?: string;
  jobType?: JobType[];
  experienceLevel?: ExperienceLevel[];
  postedAfter?: string;
  postedBefore?: string;
}

export interface ApplicantSearchFilters {
  query?: string;
  jobPostingId?: string;
  status?: ApplicationStatus[];
  source?: SourceChannel[];
  minRating?: number;
  maxRating?: number;
  appliedAfter?: string;
  appliedBefore?: string;
}

export interface InterviewSearchFilters {
  applicantId?: string;
  jobPostingId?: string;
  type?: InterviewType[];
  status?: InterviewStatus[];
  scheduledAfter?: string;
  scheduledBefore?: string;
  interviewerId?: string;
}
