import type { LeaveRequestStatus } from "@/lib/types/leave";

export type ApiLeaveType = {
  id: string;
  name: string;
  nameAr?: string | null;
  code: string;
  color?: string | null;
  isActive: boolean;
};

export type UiLeaveRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  departmentId: string;
  departmentName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  reason: string;
  status: LeaveRequestStatus;
  attachmentUrl?: string | null;
  delegateEmployeeId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  approvedAt?: string | null;
  approvedById?: string | null;
  rejectionReason?: string | null;
};

export function mapRequestStatusToUi(value: string | null | undefined): LeaveRequestStatus {
  switch (value) {
    case "PENDING":
      return "pending";
    case "APPROVED":
      return "approved";
    case "REJECTED":
      return "rejected";
    case "CANCELLED":
      return "cancelled";
    case "TAKEN":
      return "taken";
    default:
      return "pending";
  }
}

export function toYmd(value: any): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function toIso(value: any): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function toNumber(value: any): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}
