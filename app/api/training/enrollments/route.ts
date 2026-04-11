import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function mapEnrollmentStatus(value: string): string {
  switch (value) {
    case "PENDING":
      return "pending";
    case "APPROVED":
      return "approved";
    case "REJECTED":
      return "rejected";
    case "ENROLLED":
      return "enrolled";
    case "IN_PROGRESS":
      return "in-progress";
    case "COMPLETED":
      return "completed";
    case "FAILED":
      return "failed";
    case "WITHDRAWN":
      return "withdrawn";
    default:
      return "pending";
  }
}

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

function scoreToGrade(score: number): string | undefined {
  if (!Number.isFinite(score)) return undefined;
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

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

    const enrollments = await prisma.trainingEnrollment.findMany({
      where: { tenantId },
      orderBy: [{ createdAt: "desc" }],
      include: {
        course: { select: { id: true, title: true, durationHours: true } },
        employee: {
          select: {
            id: true,
            avatar: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            department: { select: { name: true, nameAr: true } }
          }
        }
      }
    });

    return NextResponse.json({
      data: {
        enrollments: enrollments.map((e) => {
          const score = e.score ? Number(e.score.toString()) : undefined;
          return {
            id: e.id,
            courseId: e.courseId,
            courseTitle: e.course.title,
            employeeId: e.employeeId,
            employeeName: employeeDisplayName(e.employee),
            employeeAvatar: e.employee.avatar ?? undefined,
            departmentName: e.employee.department?.nameAr || e.employee.department?.name || "-",
            status: mapEnrollmentStatus(e.status),
            enrollmentDate: e.enrolledAt.toISOString(),
            approvedBy: undefined,
            approvedAt: e.approvedAt ? e.approvedAt.toISOString() : undefined,
            startDate: e.enrolledAt.toISOString(),
            completionDate: e.completedAt ? e.completedAt.toISOString() : undefined,
            progress: e.progress,
            score,
            grade: score !== undefined ? scoreToGrade(score) : undefined,
            feedback: e.feedback ?? undefined,
            certificate: undefined,
            createdAt: e.createdAt.toISOString(),
            updatedAt: e.updatedAt.toISOString()
          };
        })
      }
    });
  } catch (error) {
    console.error("Error fetching training enrollments:", error);
    return NextResponse.json({ error: "Failed to fetch training enrollments" }, { status: 500 });
  }
}
