// نظام التدريب والتطوير - Training & Development System

// ==================== الدورات التدريبية ====================

export type CourseStatus = 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

export const courseStatusLabels: Record<CourseStatus, string> = {
  'draft': 'مسودة',
  'scheduled': 'مجدول',
  'ongoing': 'جاري',
  'completed': 'مكتمل',
  'cancelled': 'ملغي',
};

export const courseStatusColors: Record<CourseStatus, string> = {
  'draft': 'bg-gray-100 text-gray-800',
  'scheduled': 'bg-blue-100 text-blue-800',
  'ongoing': 'bg-yellow-100 text-yellow-800',
  'completed': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800',
};

export type CourseType = 'in-person' | 'online' | 'hybrid' | 'self-paced' | 'workshop' | 'conference';

export const courseTypeLabels: Record<CourseType, string> = {
  'in-person': 'حضوري',
  'online': 'عن بُعد',
  'hybrid': 'مختلط',
  'self-paced': 'ذاتي',
  'workshop': 'ورشة عمل',
  'conference': 'مؤتمر',
};

export type CourseCategory = 'technical' | 'soft-skills' | 'leadership' | 'compliance' | 'safety' | 'onboarding' | 'other';

export const courseCategoryLabels: Record<CourseCategory, string> = {
  'technical': 'تقني',
  'soft-skills': 'مهارات شخصية',
  'leadership': 'قيادة',
  'compliance': 'امتثال',
  'safety': 'سلامة',
  'onboarding': 'تهيئة',
  'other': 'أخرى',
};

export interface TrainingCourse {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  category: CourseCategory;
  type: CourseType;
  status: CourseStatus;
  instructor?: InstructorInfo;
  provider?: string;
  duration: number; // hours
  maxParticipants?: number;
  currentParticipants: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  meetingLink?: string;
  objectives: string[];
  prerequisites?: string[];
  materials?: CourseMaterial[];
  cost?: number;
  currency?: string;
  isMandatory: boolean;
  targetDepartments?: string[];
  targetRoles?: string[];
  certificate?: CertificateInfo;
  rating?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstructorInfo {
  id: string;
  name: string;
  nameEn?: string;
  title?: string;
  bio?: string;
  avatar?: string;
  email?: string;
  isExternal: boolean;
}

export interface CourseMaterial {
  id: string;
  title: string;
  type: 'document' | 'video' | 'link' | 'presentation' | 'other';
  url: string;
  size?: number;
}

export interface CertificateInfo {
  name: string;
  validityPeriod?: number; // months
  expiryDate?: string;
}

// ==================== تسجيل الموظفين ====================

export type EnrollmentStatus = 'pending' | 'approved' | 'rejected' | 'enrolled' | 'in-progress' | 'completed' | 'failed' | 'withdrawn';

export const enrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  'pending': 'بانتظار الموافقة',
  'approved': 'موافق عليه',
  'rejected': 'مرفوض',
  'enrolled': 'مسجل',
  'in-progress': 'قيد التدريب',
  'completed': 'مكتمل',
  'failed': 'راسب',
  'withdrawn': 'منسحب',
};

export const enrollmentStatusColors: Record<EnrollmentStatus, string> = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'approved': 'bg-blue-100 text-blue-800',
  'rejected': 'bg-red-100 text-red-800',
  'enrolled': 'bg-purple-100 text-purple-800',
  'in-progress': 'bg-cyan-100 text-cyan-800',
  'completed': 'bg-green-100 text-green-800',
  'failed': 'bg-orange-100 text-orange-800',
  'withdrawn': 'bg-gray-100 text-gray-800',
};

export interface CourseEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  departmentName: string;
  status: EnrollmentStatus;
  enrollmentDate: string;
  approvedBy?: string;
  approvedAt?: string;
  startDate?: string;
  completionDate?: string;
  progress: number; // 0-100
  score?: number;
  grade?: string;
  feedback?: string;
  certificate?: EmployeeCertificate;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeCertificate {
  id: string;
  name: string;
  issueDate: string;
  expiryDate?: string;
  certificateUrl?: string;
  verificationCode?: string;
}

// ==================== خطط التطوير ====================

export type DevelopmentPlanType =
  | 'individual'
  | 'team'
  | 'onboarding'
  | 'performance-improvement'
  | 'career-growth'
  | 'skill-development';

export const developmentPlanTypeLabels: Record<DevelopmentPlanType, string> = {
  'individual': 'فردية',
  'team': 'لفريق',
  'onboarding': 'تهيئة',
  'performance-improvement': 'تحسين أداء',
  'career-growth': 'نمو مهني',
  'skill-development': 'تطوير مهارات',
};

export type DevelopmentPlanPriority = 'low' | 'medium' | 'high' | 'critical';

export const developmentPlanPriorityLabels: Record<DevelopmentPlanPriority, string> = {
  'low': 'منخفضة',
  'medium': 'متوسطة',
  'high': 'عالية',
  'critical': 'حرجة',
};

export const developmentPlanPriorityColors: Record<DevelopmentPlanPriority, string> = {
  'low': 'bg-gray-100 text-gray-800',
  'medium': 'bg-yellow-100 text-yellow-800',
  'high': 'bg-orange-100 text-orange-800',
  'critical': 'bg-red-100 text-red-800',
};

export type DevelopmentPlanStatus = 'draft' | 'pending-approval' | 'active' | 'completed' | 'cancelled';

export const developmentPlanStatusLabels: Record<DevelopmentPlanStatus, string> = {
  'draft': 'مسودة',
  'pending-approval': 'بانتظار الموافقة',
  'active': 'نشط',
  'completed': 'مكتمل',
  'cancelled': 'ملغي',
};

export const developmentPlanStatusColors: Record<DevelopmentPlanStatus, string> = {
  'draft': 'bg-gray-100 text-gray-800',
  'pending-approval': 'bg-yellow-100 text-yellow-800',
  'active': 'bg-green-100 text-green-800',
  'completed': 'bg-blue-100 text-blue-800',
  'cancelled': 'bg-red-100 text-red-800',
};

export interface DevelopmentPlan {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  title: string;
  description?: string;
  notes?: string;
  type: DevelopmentPlanType;
  priority: DevelopmentPlanPriority;
  status: DevelopmentPlanStatus;
  startDate: string;
  targetDate: string;
  goals: DevelopmentGoal[];
  activities: DevelopmentActivity[];
  mentor?: MentorInfo;
  progress: number;
  createdBy: string;
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

export interface DevelopmentGoal {
  id: string;
  title: string;
  description?: string;
  targetDate: string;
  completedDate?: string;
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number;
  metrics?: string;
}

export interface DevelopmentActivity {
  id: string;
  title: string;
  type: 'course' | 'assignment' | 'mentoring' | 'reading' | 'project' | 'certification' | 'other';
  description?: string;
  courseId?: string;
  dueDate: string;
  completedDate?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  notes?: string;
}

export const activityTypeLabels: Record<DevelopmentActivity['type'], string> = {
  'course': 'دورة تدريبية',
  'assignment': 'مهمة',
  'mentoring': 'توجيه',
  'reading': 'قراءة',
  'project': 'مشروع',
  'certification': 'شهادة',
  'other': 'أخرى',
};

// ==================== المهارات والكفاءات ====================

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export const skillLevelLabels: Record<SkillLevel, string> = {
  'beginner': 'مبتدئ',
  'intermediate': 'متوسط',
  'advanced': 'متقدم',
  'expert': 'خبير',
};

export const skillLevelColors: Record<SkillLevel, string> = {
  'beginner': 'bg-blue-100 text-blue-800',
  'intermediate': 'bg-yellow-100 text-yellow-800',
  'advanced': 'bg-green-100 text-green-800',
  'expert': 'bg-purple-100 text-purple-800',
};

export interface Skill {
  id: string;
  name: string;
  nameEn?: string;
  category: string;
  description?: string;
}

export interface EmployeeSkill {
  id: string;
  employeeId: string;
  skillId: string;
  skillName: string;
  level: SkillLevel;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface SkillGap {
  skillId: string;
  skillName: string;
  requiredLevel: SkillLevel;
  currentLevel?: SkillLevel;
  gap: number; // 0-3 (levels difference)
  priority: 'low' | 'medium' | 'high';
  suggestedCourses?: string[];
}

// ==================== طلبات التدريب ====================

export type TrainingRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export const trainingRequestStatusLabels: Record<TrainingRequestStatus, string> = {
  'pending': 'بانتظار الموافقة',
  'approved': 'موافق عليه',
  'rejected': 'مرفوض',
  'completed': 'مكتمل',
};

export const trainingRequestStatusColors: Record<TrainingRequestStatus, string> = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'approved': 'bg-green-100 text-green-800',
  'rejected': 'bg-red-100 text-red-800',
  'completed': 'bg-blue-100 text-blue-800',
};

export interface TrainingRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  courseId?: string;
  courseTitle?: string;
  externalCourse?: {
    name: string;
    provider: string;
    url?: string;
    cost: number;
    startDate: string;
    endDate: string;
  };
  reason: string;
  status: TrainingRequestStatus;
  approvers: RequestApprover[];
  submittedAt: string;
  processedAt?: string;
  comments?: string;
}

export interface RequestApprover {
  id: string;
  name: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  actionAt?: string;
}

// ==================== إحصائيات التدريب ====================

export interface TrainingStats {
  totalCourses: number;
  activeCourses: number;
  totalEnrollments: number;
  completedEnrollments: number;
  pendingRequests: number;
  totalHoursCompleted: number;
  averageScore: number;
  certificationRate: number;
  budgetUsed: number;
  budgetTotal: number;
  enrollmentsByCategory: { category: CourseCategory; count: number }[];
  completionTrend: { month: string; completed: number; enrolled: number }[];
  topCourses: { courseId: string; title: string; enrollments: number; rating: number }[];
}



