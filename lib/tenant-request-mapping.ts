import type {
  RequestedSubscriptionPlan,
  SubscriptionRequest,
  TenantRequestActivationStage,
  TenantStatus
} from "@/lib/types/tenant";

type TenantRequestTenantSnapshot = {
  status: string;
  setupCompletedAt: Date | null;
} | null;

type TenantRequestRecord = {
  id: string;
  companyName: string;
  companyNameAr: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  employeeCount: string | null;
  plan: string;
  status: string;
  createdAt: Date;
  processedAt: Date | null;
  tenantId: string | null;
  message: string | null;
  tenant?: TenantRequestTenantSnapshot;
};

export function mapTenantRequestPlan(plan: string): RequestedSubscriptionPlan {
  if (plan === "ENTERPRISE") return "enterprise";
  if (plan === "PROFESSIONAL") return "business";
  if (plan === "BASIC") return "starter";
  return "trial";
}

export function deriveTenantRequestActivationStage({
  requestStatus,
  tenantStatus,
  setupCompletedAt
}: {
  requestStatus: string;
  tenantStatus?: string | null;
  setupCompletedAt?: Date | string | null;
}): TenantRequestActivationStage {
  if (requestStatus === "REJECTED") {
    return "rejected";
  }

  if (!tenantStatus) {
    return "lead";
  }

  if (tenantStatus === "PENDING") {
    return "pending-activation";
  }

  if (tenantStatus === "ACTIVE") {
    return setupCompletedAt ? "active" : "activating";
  }

  if (tenantStatus === "SUSPENDED") {
    return "suspended";
  }

  return "archived";
}

export function mapTenantRequestFromDb(record: TenantRequestRecord): SubscriptionRequest {
  const tenantStatus = record.tenant?.status
    ? (record.tenant.status.toLowerCase() as TenantStatus)
    : undefined;
  const setupCompletedAt = record.tenant?.setupCompletedAt?.toISOString();

  return {
    id: record.id,
    companyName: record.companyName,
    companyNameAr: record.companyNameAr ?? undefined,
    contactName: record.contactName,
    contactEmail: record.contactEmail,
    contactPhone: record.contactPhone ?? undefined,
    employeesCount: record.employeeCount ?? undefined,
    plan: mapTenantRequestPlan(record.plan),
    status:
      record.status === "PENDING"
        ? "pending"
        : record.status === "APPROVED"
          ? "approved"
          : "rejected",
    createdAt: record.createdAt.toISOString(),
    reviewedAt: record.processedAt?.toISOString(),
    tenantId: record.tenantId ?? undefined,
    message: record.message ?? undefined,
    tenantStatus,
    setupCompletedAt,
    activationStage: deriveTenantRequestActivationStage({
      requestStatus: record.status,
      tenantStatus: record.tenant?.status,
      setupCompletedAt: record.tenant?.setupCompletedAt
    })
  };
}