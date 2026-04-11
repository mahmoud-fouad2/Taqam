/**
 * Notification Service
 * إرسال الإشعارات داخل النظام
 *
 * يدعم حالياً:
 *   - إشعارات داخلية (DB)
 *   - قابل للتوسيع: بريد إلكتروني (Resend/Nodemailer) + Push Notifications
 */

import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

export type NotificationType =
  | "leave-request"
  | "leave-approved"
  | "leave-rejected"
  | "attendance-warning"
  | "document-expiry"
  | "payslip-ready"
  | "announcement"
  | "evaluation-assigned"
  | "goal-due"
  | "loan-approved"
  | "loan-rejected"
  | "onboarding-task"
  | "general";

export type SendNotificationInput = {
  tenantId: string | null;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Send an in-app notification to a user
 */
export async function sendNotification(input: SendNotificationInput): Promise<void> {
  await prisma.notification.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
      metadata: (input.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      isRead: false
    }
  });
}

/**
 * Send notifications to multiple users at once
 */
export async function sendBulkNotification(inputs: SendNotificationInput[]): Promise<void> {
  if (inputs.length === 0) return;

  await prisma.notification.createMany({
    data: inputs.map((input) => ({
      tenantId: input.tenantId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      isRead: false
    }))
  });
}

/**
 * Mark notification(s) as read
 */
export async function markNotificationsRead(
  userId: string,
  notificationIds?: string[]
): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
      ...(notificationIds ? { id: { in: notificationIds } } : {})
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });
}

// =============================================
// Preset notifications for common events
// =============================================

export async function notifyLeaveRequestSubmitted(params: {
  tenantId: string;
  managerUserId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  requestId: string;
}): Promise<void> {
  await sendNotification({
    tenantId: params.tenantId,
    userId: params.managerUserId,
    type: "leave-request",
    title: "طلب إجازة جديد",
    message: `${params.employeeName} طلب إجازة ${params.leaveType} من ${params.startDate} إلى ${params.endDate}`,
    link: `/dashboard/leave-requests?id=${params.requestId}`,
    metadata: { requestId: params.requestId }
  });
}

export async function notifyLeaveStatusChanged(params: {
  tenantId: string;
  employeeUserId: string;
  status: "approved" | "rejected";
  leaveType: string;
  rejectionReason?: string;
  requestId: string;
}): Promise<void> {
  const approved = params.status === "approved";
  await sendNotification({
    tenantId: params.tenantId,
    userId: params.employeeUserId,
    type: approved ? "leave-approved" : "leave-rejected",
    title: approved ? "تمت الموافقة على طلب الإجازة" : "تم رفض طلب الإجازة",
    message: approved
      ? `تمت الموافقة على طلب إجازة ${params.leaveType} الخاص بك`
      : `تم رفض طلب إجازة ${params.leaveType} الخاص بك${params.rejectionReason ? `: ${params.rejectionReason}` : ""}`,
    link: `/dashboard/my-requests?id=${params.requestId}`,
    metadata: { requestId: params.requestId }
  });
}

export async function notifyPayslipReady(params: {
  tenantId: string;
  employeeUserId: string;
  periodName: string;
  payslipId: string;
}): Promise<void> {
  await sendNotification({
    tenantId: params.tenantId,
    userId: params.employeeUserId,
    type: "payslip-ready",
    title: "قسيمة الراتب جاهزة",
    message: `قسيمة راتب ${params.periodName} متاحة الآن`,
    link: "/dashboard/payslips",
    metadata: { payslipId: params.payslipId }
  });
}

// =============================================
// Loan notifications
// =============================================

export async function notifyLoanApproved(params: {
  tenantId: string;
  employeeUserId: string;
  amount: number;
  currency?: string;
  loanId: string;
}): Promise<void> {
  const currency = params.currency ?? "ر.س";
  await sendNotification({
    tenantId: params.tenantId,
    userId: params.employeeUserId,
    type: "loan-approved",
    title: "تمت الموافقة على طلب القرض",
    message: `تمت الموافقة على قرضك بمبلغ ${params.amount.toLocaleString("ar")} ${currency}`,
    link: `/dashboard/loans`,
    metadata: { loanId: params.loanId }
  });
}

export async function notifyLoanRejected(params: {
  tenantId: string;
  employeeUserId: string;
  reason?: string;
  loanId: string;
}): Promise<void> {
  await sendNotification({
    tenantId: params.tenantId,
    userId: params.employeeUserId,
    type: "loan-rejected",
    title: "تم رفض طلب القرض",
    message: params.reason ? `تم رفض طلب قرضك: ${params.reason}` : "تم رفض طلب قرضك",
    link: `/dashboard/loans`,
    metadata: { loanId: params.loanId }
  });
}

// =============================================
// Training enrollment notifications
// =============================================

export async function notifyTrainingEnrollmentApproved(params: {
  tenantId: string;
  employeeUserId: string;
  courseTitle: string;
  enrollmentId: string;
}): Promise<void> {
  await sendNotification({
    tenantId: params.tenantId,
    userId: params.employeeUserId,
    type: "general",
    title: "تم قبولك في الدورة التدريبية",
    message: `تمت الموافقة على تسجيلك في "${params.courseTitle}"`,
    link: `/dashboard/training-enrollments`,
    metadata: { enrollmentId: params.enrollmentId }
  });
}

export async function notifyTrainingEnrollmentRejected(params: {
  tenantId: string;
  employeeUserId: string;
  courseTitle: string;
  enrollmentId: string;
}): Promise<void> {
  await sendNotification({
    tenantId: params.tenantId,
    userId: params.employeeUserId,
    type: "general",
    title: "لم يتم قبول طلب التسجيل",
    message: `تم رفض تسجيلك في "${params.courseTitle}"`,
    link: `/dashboard/training-enrollments`,
    metadata: { enrollmentId: params.enrollmentId }
  });
}

export async function notifyTrainingCompleted(params: {
  tenantId: string;
  employeeUserId: string;
  courseTitle: string;
  score?: number;
  enrollmentId: string;
}): Promise<void> {
  const scoreText = params.score != null ? ` بدرجة ${params.score}%` : "";
  await sendNotification({
    tenantId: params.tenantId,
    userId: params.employeeUserId,
    type: "general",
    title: "أتممت دورة تدريبية",
    message: `تهانينا! أتممت دورة "${params.courseTitle}"${scoreText}`,
    link: `/dashboard/training-enrollments`,
    metadata: { enrollmentId: params.enrollmentId }
  });
}

// =============================================
// Onboarding notifications
// =============================================

export async function notifyOnboardingTaskAssigned(params: {
  tenantId: string;
  employeeUserId: string;
  taskTitle: string;
  processId: string;
}): Promise<void> {
  await sendNotification({
    tenantId: params.tenantId,
    userId: params.employeeUserId,
    type: "onboarding-task",
    title: "مهمة إلحاق جديدة",
    message: `لديك مهمة جديدة: "${params.taskTitle}"`,
    link: `/dashboard/onboarding`,
    metadata: { processId: params.processId }
  });
}

// =============================================
// Announcement notification
// =============================================

export async function notifyNewAnnouncement(params: {
  tenantId: string;
  targetUserIds: string[];
  announcementTitle: string;
  announcementId: string;
}): Promise<void> {
  await sendBulkNotification(
    params.targetUserIds.map((userId) => ({
      tenantId: params.tenantId,
      userId,
      type: "announcement" as NotificationType,
      title: "إعلان جديد",
      message: params.announcementTitle,
      link: `/dashboard`,
      metadata: { announcementId: params.announcementId }
    }))
  );
}

// =============================================
// Attendance request notifications
// =============================================

export async function notifyAttendanceRequestResult(params: {
  tenantId: string;
  employeeUserId: string;
  status: "approved" | "rejected";
  requestType: string;
  rejectionReason?: string;
}): Promise<void> {
  const approved = params.status === "approved";
  await sendNotification({
    tenantId: params.tenantId,
    userId: params.employeeUserId,
    type: "general",
    title: approved ? "تمت الموافقة على طلبك" : "تم رفض طلبك",
    message: approved
      ? `تمت الموافقة على طلب ${params.requestType} الخاص بك`
      : `تم رفض طلب ${params.requestType} الخاص بك${params.rejectionReason ? `: ${params.rejectionReason}` : ""}`,
    link: `/dashboard/my-requests`,
    metadata: {}
  });
}
