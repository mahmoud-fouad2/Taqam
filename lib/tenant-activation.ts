import { ensureEmployeeWorkspaceProfile } from "@/lib/employees/workspace-provisioning";
import type { PrismaTransactionClient } from "@/lib/db";

type TenantActivationClient = Pick<
  PrismaTransactionClient,
  "$queryRaw" | "department" | "employee" | "jobTitle" | "user"
>;

export async function ensureTenantAdminWorkspaceProfile(
  client: TenantActivationClient,
  {
    tenantId,
    userId
  }: {
    tenantId: string;
    userId?: string | null;
  }
) {
  const adminUser = await client.user.findFirst({
    where: {
      tenantId,
      role: "TENANT_ADMIN",
      ...(userId ? { id: userId } : {})
    },
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true
    }
  });

  if (!adminUser) {
    return null;
  }

  const employeeProfile = await ensureEmployeeWorkspaceProfile(client, {
    tenantId,
    userId: adminUser.id,
    email: adminUser.email,
    firstName: adminUser.firstName,
    lastName: adminUser.lastName,
    phone: adminUser.phone,
    role: adminUser.role
  });

  return {
    adminUserId: adminUser.id,
    employeeId: employeeProfile.employeeId,
    action: employeeProfile.action
  };
}
