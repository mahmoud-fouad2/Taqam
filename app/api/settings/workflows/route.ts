import { logApiError } from "@/lib/api/route-helper";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

type ApprovalWorkflow = {
  id: string;
  name: string;
  type: "leave" | "expense" | "loan" | "overtime" | "document" | "general";
  steps: Array<{
    id: string;
    order: number;
    approverType: "direct-manager" | "department-head" | "hr" | "specific-user" | "role";
    approverId?: string;
    roleId?: string;
    canSkip: boolean;
    autoApproveAfter?: number;
  }>;
  isActive: boolean;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true }
    });

    const settingsObj =
      tenant?.settings && typeof tenant.settings === "object" ? (tenant.settings as any) : {};
    const workflows = (settingsObj?.approvalWorkflows ?? []) as ApprovalWorkflow[];

    return NextResponse.json({ data: Array.isArray(workflows) ? workflows : [] });
  } catch (e) {
    logApiError("GET /api/settings/workflows failed", e);
    return NextResponse.json({ error: "Failed to load workflows" }, { status: 500 });
  }
}
