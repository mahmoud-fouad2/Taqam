import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type {
  RequestStatus,
  SelfServiceRequest,
  SelfServiceRequestType
} from "@/lib/types/self-service";

function employeeDisplayName(employee: {
  firstName: string;
  lastName: string;
  firstNameAr: string | null;
  lastNameAr: string | null;
}): string {
  const ar = [employee.firstNameAr, employee.lastNameAr].filter(Boolean).join(" ").trim();
  if (ar) return ar;
  return `${employee.firstName} ${employee.lastName}`.trim();
}

function mapDbRequestStatus(db: string | null | undefined): RequestStatus {
  switch (String(db)) {
    case "PENDING":
      return "pending";
    case "APPROVED":
      return "approved";
    case "REJECTED":
      return "rejected";
    case "CANCELLED":
      return "cancelled";
    default:
      return "pending";
  }
}

function mapTicketStatus(db: string | null | undefined): RequestStatus {
  switch (String(db)) {
    case "RESOLVED":
    case "CLOSED":
      return "approved";
    case "OPEN":
    case "IN_PROGRESS":
    case "WAITING_CUSTOMER":
    default:
      return "pending";
  }
}

function mapEnrollmentStatus(db: string | null | undefined): RequestStatus {
  switch (String(db)) {
    case "PENDING":
      return "pending";
    case "APPROVED":
    case "ENROLLED":
    case "IN_PROGRESS":
    case "COMPLETED":
      return "approved";
    case "REJECTED":
      return "rejected";
    case "WITHDRAWN":
      return "cancelled";
    default:
      return "pending";
  }
}

const createSchema = z
  .object({
    type: z.literal("ticket"),
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(3).max(5000),
    category: z.string().trim().max(60).optional(),
    priority: z.enum(["low", "medium", "high"]).optional()
  })
  .strict();

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const userId = session.user.id;

    const employee = await prisma.employee.findFirst({
      where: { tenantId, userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        firstNameAr: true,
        lastNameAr: true
      }
    });

    const employeeId = employee?.id;
    const employeeName = employee
      ? employeeDisplayName(employee)
      : `${session.user.firstName} ${session.user.lastName}`.trim();

    const [leaveRequests, attendanceRequests, enrollments, tickets] = await Promise.all([
      employeeId
        ? prisma.leaveRequest.findMany({
            where: { tenantId, employeeId },
            orderBy: { createdAt: "desc" },
            include: { leaveType: { select: { name: true, nameAr: true } } }
          })
        : Promise.resolve([]),
      employeeId
        ? prisma.attendanceRequest.findMany({
            where: { tenantId, employeeId },
            orderBy: { createdAt: "desc" }
          })
        : Promise.resolve([]),
      employeeId
        ? prisma.trainingEnrollment.findMany({
            where: { tenantId, employeeId },
            orderBy: { createdAt: "desc" },
            include: { course: { select: { title: true } } }
          })
        : Promise.resolve([]),
      prisma.supportTicket.findMany({
        where: { tenantId, createdById: userId },
        orderBy: { lastMessageAt: "desc" },
        include: {
          _count: { select: { messages: true } }
        }
      })
    ]);

    const items: SelfServiceRequest[] = [];

    for (const lr of leaveRequests) {
      const leaveTypeName = lr.leaveType?.nameAr || lr.leaveType?.name || "إجازة";
      const start = lr.startDate.toISOString().split("T")[0];
      const end = lr.endDate.toISOString().split("T")[0];
      items.push({
        id: `leave:${lr.id}`,
        type: "leave",
        employeeId: employeeId ?? "",
        employeeName,
        title: `${leaveTypeName} (${start} → ${end})`,
        description: lr.reason ?? undefined,
        status: mapDbRequestStatus(lr.status),
        priority: "medium",
        attachments: lr.attachmentUrl ? [lr.attachmentUrl] : undefined,
        approvers: [],
        createdAt: lr.createdAt.toISOString(),
        updatedAt: lr.updatedAt.toISOString(),
        resolvedAt: lr.approvedAt ? lr.approvedAt.toISOString() : undefined,
        metadata: { source: "leave", sourceId: lr.id }
      });
    }

    for (const ar of attendanceRequests) {
      const date = ar.date.toISOString().split("T")[0];
      let type: SelfServiceRequestType = "overtime";
      let title = `طلب حضور/دوام (${date})`;

      if (String(ar.type) === "OVERTIME") {
        type = "overtime";
        title = `طلب عمل إضافي (${date})`;
      } else if (String(ar.type) === "WORK_FROM_HOME") {
        type = "remote-work";
        title = `طلب عمل عن بُعد (${date})`;
      } else if (String(ar.type) === "PERMISSION") {
        type = "profile-update";
        title = `طلب إذن (${date})`;
      } else if (String(ar.type) === "CHECK_CORRECTION") {
        type = "profile-update";
        title = `طلب تعديل حضور (${date})`;
      }

      items.push({
        id: `attendance:${ar.id}`,
        type,
        employeeId: employeeId ?? "",
        employeeName,
        title,
        description: ar.reason,
        status: mapDbRequestStatus(ar.status),
        priority: "medium",
        attachments: ar.attachmentUrl ? [ar.attachmentUrl] : undefined,
        approvers: [],
        createdAt: ar.createdAt.toISOString(),
        updatedAt: ar.updatedAt.toISOString(),
        resolvedAt: ar.approvedAt ? ar.approvedAt.toISOString() : undefined,
        metadata: { source: "attendance", sourceId: ar.id }
      });
    }

    for (const e of enrollments) {
      items.push({
        id: `training:${e.id}`,
        type: "training",
        employeeId: employeeId ?? "",
        employeeName,
        title: `طلب تدريب: ${e.course.title}`,
        description: undefined,
        status: mapEnrollmentStatus(e.status),
        priority: "medium",
        approvers: [],
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
        resolvedAt: e.approvedAt ? e.approvedAt.toISOString() : undefined,
        metadata: { source: "training", sourceId: e.id }
      });
    }

    for (const t of tickets) {
      const priority: "low" | "medium" | "high" =
        String(t.priority) === "LOW"
          ? "low"
          : String(t.priority) === "URGENT" || String(t.priority) === "HIGH"
            ? "high"
            : "medium";

      items.push({
        id: `ticket:${t.id}`,
        type: "ticket",
        employeeId: employeeId ?? `user:${userId}`,
        employeeName,
        title: t.subject,
        description: t.category ?? undefined,
        status: mapTicketStatus(t.status),
        priority,
        approvers: [],
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        resolvedAt:
          String(t.status) === "RESOLVED" || String(t.status) === "CLOSED"
            ? t.updatedAt.toISOString()
            : undefined,
        metadata: { source: "ticket", sourceId: t.id, messageCount: (t as any)._count?.messages }
      });
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ data: { items } });
  } catch (error) {
    console.error("Error fetching my requests:", error);
    return NextResponse.json({ error: "Failed to fetch my requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const raw = await request.json();
    const parsed = createSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const now = new Date();
    const status = "OPEN" as const;

    const created = await prisma.supportTicket.create({
      data: {
        tenantId,
        createdById: session.user.id,
        subject: parsed.data.title,
        category: parsed.data.category,
        priority:
          parsed.data.priority === "low"
            ? "LOW"
            : parsed.data.priority === "high"
              ? "HIGH"
              : "NORMAL",
        status,
        lastMessageAt: now,
        messages: {
          create: {
            senderId: session.user.id,
            body: parsed.data.description,
            isInternal: false
          }
        }
      },
      include: {
        _count: { select: { messages: true } }
      }
    });

    const employee = await prisma.employee.findFirst({
      where: { tenantId, userId: session.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        firstNameAr: true,
        lastNameAr: true
      }
    });

    const employeeName = employee
      ? employeeDisplayName(employee)
      : `${session.user.firstName} ${session.user.lastName}`.trim();

    const responseItem: SelfServiceRequest = {
      id: `ticket:${created.id}`,
      type: "ticket",
      employeeId: employee?.id ?? `user:${session.user.id}`,
      employeeName,
      title: created.subject,
      description: created.category ?? undefined,
      status: mapTicketStatus(created.status),
      priority: parsed.data.priority ?? "medium",
      approvers: [],
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
      resolvedAt: undefined,
      metadata: {
        source: "ticket",
        sourceId: created.id,
        messageCount: (created as any)._count?.messages
      }
    };

    return NextResponse.json({ data: responseItem }, { status: 201 });
  } catch (error) {
    console.error("Error creating my request:", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
