/**
 * Document Types & Storage
 * نظام إدارة الوثائق والملفات
 */

export type DocumentCategory =
  | "personal" // وثائق شخصية (هوية، جواز)
  | "employment" // وثائق توظيف (عقد، خطاب تعيين)
  | "education" // شهادات تعليمية
  | "medical" // تقارير طبية
  | "financial" // وثائق مالية
  | "legal" // وثائق قانونية
  | "other"; // أخرى

export type DocumentStatus = "pending" | "approved" | "rejected" | "expired";

export interface Document {
  id: string;

  // File info
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number; // bytes
  url: string; // Storage URL (local or R2)

  // Metadata
  category: DocumentCategory;
  title: string;
  titleAr?: string;
  description?: string;

  // Relation
  employeeId: string;
  tenantId: string;

  // Status & Dates
  status: DocumentStatus;
  expiryDate?: string;
  issuedDate?: string;

  // Audit
  uploadedBy: string;
  uploadedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
}

export interface DocumentUploadInput {
  file: File;
  category: DocumentCategory;
  title: string;
  titleAr?: string;
  description?: string;
  employeeId: string;
  expiryDate?: string;
  issuedDate?: string;
}

// Category labels
export const documentCategoryLabels: Record<DocumentCategory, { en: string; ar: string }> = {
  personal: { en: "Personal Documents", ar: "وثائق شخصية" },
  employment: { en: "Employment Documents", ar: "وثائق توظيف" },
  education: { en: "Education Certificates", ar: "شهادات تعليمية" },
  medical: { en: "Medical Records", ar: "تقارير طبية" },
  financial: { en: "Financial Documents", ar: "وثائق مالية" },
  legal: { en: "Legal Documents", ar: "وثائق قانونية" },
  other: { en: "Other", ar: "أخرى" }
};

export const documentStatusLabels: Record<
  DocumentStatus,
  { en: string; ar: string; color: string }
> = {
  pending: { en: "Pending Review", ar: "قيد المراجعة", color: "bg-yellow-500" },
  approved: { en: "Approved", ar: "معتمد", color: "bg-green-500" },
  rejected: { en: "Rejected", ar: "مرفوض", color: "bg-red-500" },
  expired: { en: "Expired", ar: "منتهي الصلاحية", color: "bg-gray-500" }
};

// Helper functions
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("image")) return "🖼️";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊";
  return "📁";
}

export function isDocumentExpired(doc: Document): boolean {
  if (!doc.expiryDate) return false;
  return new Date(doc.expiryDate) < new Date();
}

export function getDocumentsForEmployee(employeeId: string, docs: Document[]): Document[] {
  return docs.filter((d) => d.employeeId === employeeId);
}
