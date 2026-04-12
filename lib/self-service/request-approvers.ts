import type { RequestApprover, RequestStatus } from "@/lib/types/self-service";

type NameFields = {
  firstName: string;
  lastName: string;
  firstNameAr?: string | null;
  lastNameAr?: string | null;
};

export type EmployeeApproverCandidate = NameFields & {
  id: string;
  userId?: string | null;
};

export type UserApproverCandidate = {
  id: string;
  firstName: string;
  lastName: string;
  role?: string | null;
  employee?: EmployeeApproverCandidate | null;
};

const approverRolePriority: Record<string, number> = {
  HR_MANAGER: 0,
  TENANT_ADMIN: 1,
  SUPER_ADMIN: 2,
  MANAGER: 3
};

function approverStatusFromRequestStatus(status: RequestStatus): RequestApprover["status"] {
  if (status === "approved") {
    return "approved";
  }

  if (status === "rejected") {
    return "rejected";
  }

  return "pending";
}

function toIso(value: Date | string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

function approverRoleLabel(role: string | null | undefined): string {
  switch (role) {
    case "HR_MANAGER":
      return "مدير الموارد البشرية";
    case "TENANT_ADMIN":
      return "مسؤول الشركة";
    case "SUPER_ADMIN":
      return "المسؤول العام";
    case "MANAGER":
      return "مدير";
    default:
      return "معتمد";
  }
}

export function employeeDisplayName(employee: NameFields): string {
  const arabicName = [employee.firstNameAr, employee.lastNameAr].filter(Boolean).join(" ").trim();
  if (arabicName) {
    return arabicName;
  }

  return `${employee.firstName} ${employee.lastName}`.trim();
}

export function userDisplayName(user: UserApproverCandidate): string {
  if (user.employee) {
    return employeeDisplayName(user.employee);
  }

  return `${user.firstName} ${user.lastName}`.trim();
}

export function pickFallbackApprover(
  approvers: UserApproverCandidate[],
  excludeUserId?: string | null
): UserApproverCandidate | null {
  const filteredApprovers = approvers.filter((approver) => approver.id !== excludeUserId);
  if (filteredApprovers.length === 0) {
    return null;
  }

  return [...filteredApprovers].sort((left, right) => {
    const leftPriority = approverRolePriority[left.role ?? ""] ?? Number.MAX_SAFE_INTEGER;
    const rightPriority = approverRolePriority[right.role ?? ""] ?? Number.MAX_SAFE_INTEGER;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return userDisplayName(left).localeCompare(userDisplayName(right), "ar");
  })[0] ?? null;
}

export function buildManagedRequestApprovers(args: {
  requestStatus: RequestStatus;
  directManager?: EmployeeApproverCandidate | null;
  fallbackApprover?: UserApproverCandidate | null;
  resolvedBy?: UserApproverCandidate | null;
  actionAt?: Date | string | null;
  rejectionReason?: string | null;
}): RequestApprover[] {
  const status = approverStatusFromRequestStatus(args.requestStatus);
  const actionAt = toIso(args.actionAt);
  const comments = status === "rejected" ? args.rejectionReason ?? undefined : undefined;

  if (args.resolvedBy) {
    return [
      {
        id: args.resolvedBy.id,
        name: userDisplayName(args.resolvedBy),
        role:
          args.directManager?.userId && args.directManager.userId === args.resolvedBy.id
            ? "المدير المباشر"
            : approverRoleLabel(args.resolvedBy.role),
        status,
        comments,
        actionAt
      }
    ];
  }

  if (args.directManager) {
    return [
      {
        id: args.directManager.userId ?? args.directManager.id,
        name: employeeDisplayName(args.directManager),
        role: "المدير المباشر",
        status,
        comments,
        actionAt
      }
    ];
  }

  if (args.fallbackApprover) {
    return [
      {
        id: args.fallbackApprover.id,
        name: userDisplayName(args.fallbackApprover),
        role: approverRoleLabel(args.fallbackApprover.role),
        status,
        comments,
        actionAt
      }
    ];
  }

  return [];
}

export function buildAssignedRequestApprovers(args: {
  requestStatus: RequestStatus;
  assignee?: UserApproverCandidate | null;
  actionAt?: Date | string | null;
}): RequestApprover[] {
  if (!args.assignee) {
    return [];
  }

  return [
    {
      id: args.assignee.id,
      name: userDisplayName(args.assignee),
      role: approverRoleLabel(args.assignee.role),
      status: approverStatusFromRequestStatus(args.requestStatus),
      actionAt: toIso(args.actionAt)
    }
  ];
}