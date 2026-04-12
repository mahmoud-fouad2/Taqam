import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireMobileEmployeeAuthWithDevice } from "@/lib/mobile/auth";
import type {
  RequestStatus,
  SelfServiceRequest,
  SelfServiceRequestType
} from "@/lib/types/self-service";
import {
  buildAssignedRequestApprovers,
  buildManagedRequestApprovers,
  employeeDisplayName,
  pickFallbackApprover,
  type UserApproverCandidate
} from "@/lib/self-service/request-approvers";

const FALLBACK_APPROVER_ROLES = ["HR_MANAGER", "TENANT_ADMIN", "SUPER_ADMIN", "MANAGER"];

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

export async function GET(request: NextRequest) {
  const payloadOrRes = await requireMobileEmployeeAuthWithDevice(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  try {
    const tenantId = payloadOrRes.tenantId;
    const userId = payloadOrRes.userId;

    const employee = await prisma.employee.findFirst({
      where: { tenantId, id: payloadOrRes.employeeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        firstNameAr: true,
        lastNameAr: true,
        manager: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true
          }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee context required" }, { status: 400 });
    }

    const employeeId = employee.id;
    const employeeName = employeeDisplayName(employee);

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
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
              employee: {
                select: {
                  id: true,
                  userId: true,
                  firstName: true,
                  lastName: true,
                  firstNameAr: true,
                  lastNameAr: true
                }
              }
            }
          },
          _count: { select: { messages: true } }
        }
      })
    ]);

    const actualApproverIds = [
      ...new Set(
        [...leaveRequests, ...attendanceRequests]
          .map((requestItem) => requestItem.approvedById)
          .filter((value): value is string => Boolean(value))
      )
    ];

    const [actualApproverUsers, fallbackApproverUsers] = await Promise.all([
      actualApproverIds.length > 0
        ? prisma.user.findMany({
            where: { id: { in: actualApproverIds } },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
              employee: {
                select: {
                  id: true,
                  userId: true,
                  firstName: true,
                  lastName: true,
                  firstNameAr: true,
                  lastNameAr: true
                }
              }
            }
          })
        : Promise.resolve([]),
      prisma.user.findMany({
        where: {
          tenantId,
          status: "ACTIVE",
          role: { in: FALLBACK_APPROVER_ROLES as any }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          employee: {
            select: {
              id: true,
              userId: true,
              firstName: true,
              lastName: true,
              firstNameAr: true,
              lastNameAr: true
            }
          }
        }
      })
    ]);

    const approverUsersById = new Map<string, UserApproverCandidate>();
    for (const approver of [...actualApproverUsers, ...fallbackApproverUsers]) {
      approverUsersById.set(approver.id, approver);
    }

    const directManager = employee.manager && employee.manager.id !== employee.id ? employee.manager : null;
    const fallbackApprover = pickFallbackApprover(fallbackApproverUsers, userId);

    const items: SelfServiceRequest[] = [];

    for (const lr of leaveRequests) {
      const leaveTypeName = lr.leaveType?.nameAr || lr.leaveType?.name || "إجازة";
      const start = lr.startDate.toISOString().split("T")[0];
      const end = lr.endDate.toISOString().split("T")[0];
      const status = mapDbRequestStatus(lr.status);
      items.push({
        id: `leave:${lr.id}`,
        type: "leave",
        employeeId: employeeId ?? "",
        employeeName,
        title: `${leaveTypeName} (${start} → ${end})`,
        description: lr.reason ?? undefined,
        status,
        priority: "medium",
        attachments: lr.attachmentUrl ? [lr.attachmentUrl] : undefined,
        approvers: buildManagedRequestApprovers({
          requestStatus: status,
          directManager,
          fallbackApprover,
          resolvedBy: lr.approvedById ? (approverUsersById.get(lr.approvedById) ?? null) : null,
          actionAt: lr.approvedAt,
          rejectionReason: lr.rejectionReason
        }),
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

      const status = mapDbRequestStatus(ar.status);

      items.push({
        id: `attendance:${ar.id}`,
        type,
        employeeId: employeeId ?? "",
        employeeName,
        title,
        description: ar.reason,
        status,
        priority: "medium",
        attachments: ar.attachmentUrl ? [ar.attachmentUrl] : undefined,
        approvers: buildManagedRequestApprovers({
          requestStatus: status,
          directManager,
          fallbackApprover,
          resolvedBy: ar.approvedById ? (approverUsersById.get(ar.approvedById) ?? null) : null,
          actionAt: ar.approvedAt,
          rejectionReason: ar.rejectionReason
        }),
        createdAt: ar.createdAt.toISOString(),
        updatedAt: ar.updatedAt.toISOString(),
        resolvedAt: ar.approvedAt ? ar.approvedAt.toISOString() : undefined,
        metadata: { source: "attendance", sourceId: ar.id }
      });
    }

    for (const e of enrollments) {
      const status = mapEnrollmentStatus(e.status);
      items.push({
        id: `training:${e.id}`,
        type: "training",
        employeeId: employeeId ?? "",
        employeeName,
        title: `طلب تدريب: ${e.course.title}`,
        description: undefined,
        status,
        priority: "medium",
        approvers: [],
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
        resolvedAt: e.approvedAt ? e.approvedAt.toISOString() : undefined,
        metadata: { source: "training", sourceId: e.id }
      });
    }

    for (const t of tickets) {
      const status = mapTicketStatus(t.status);
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
        status,
        priority,
        approvers: buildAssignedRequestApprovers({
          requestStatus: status,
          assignee: t.assignedTo,
          actionAt: status === "approved" ? t.updatedAt : undefined
        }),
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
    logger.error("Mobile my-requests GET error", undefined, error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const payloadOrRes = await requireMobileEmployeeAuthWithDevice(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  try {
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
        tenantId: payloadOrRes.tenantId,
        createdById: payloadOrRes.userId,
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
            senderId: payloadOrRes.userId,
            body: parsed.data.description,
            isInternal: false
          }
        }
      },
      include: { _count: { select: { messages: true } } }
    });

    const employee = await prisma.employee.findFirst({
      where: { tenantId: payloadOrRes.tenantId, id: payloadOrRes.employeeId },
      select: { firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, id: true }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee context required" }, { status: 400 });
    }

    const employeeName = employeeDisplayName(employee);

    const responseItem: SelfServiceRequest = {
      id: `ticket:${created.id}`,
      type: "ticket",
      employeeId: employee.id,
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
    logger.error("Mobile my-requests POST error", undefined, error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
