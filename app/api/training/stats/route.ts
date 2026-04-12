import { logApiError } from "@/lib/api/route-helper";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function getNumberFromSettings(settings: unknown, key: string): number {
  if (!settings || typeof settings !== "object") return 0;
  const v = (settings as any)[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return 0;
}

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

    const [coursesCount, activeCoursesCount, enrollmentsCount, completedEnrollmentsCount, tenant] =
      await prisma.$transaction([
        prisma.trainingCourse.count({ where: { tenantId } }),
        prisma.trainingCourse.count({
          where: { tenantId, status: { in: ["SCHEDULED", "ONGOING"] } }
        }),
        prisma.trainingEnrollment.count({ where: { tenantId } }),
        prisma.trainingEnrollment.count({ where: { tenantId, status: "COMPLETED" } }),
        prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } })
      ]);

    const completedEnrollments = await prisma.trainingEnrollment.findMany({
      where: { tenantId, status: "COMPLETED" },
      select: {
        course: { select: { durationHours: true, cost: true } }
      }
    });

    const totalHoursCompleted = completedEnrollments.reduce(
      (acc, e) => acc + (e.course?.durationHours ?? 0),
      0
    );

    const budgetUsed = completedEnrollments.reduce((acc, e) => {
      const cost = e.course?.cost ? Number(e.course.cost.toString()) : 0;
      return acc + cost;
    }, 0);

    const budgetTotal = getNumberFromSettings(tenant?.settings, "trainingBudgetTotal");

    const certificationRate =
      enrollmentsCount > 0 ? Math.round((completedEnrollmentsCount / enrollmentsCount) * 100) : 0;

    return NextResponse.json({
      data: {
        totalCourses: coursesCount,
        activeCourses: activeCoursesCount,
        totalEnrollments: enrollmentsCount,
        completedEnrollments: completedEnrollmentsCount,
        totalHoursCompleted,
        certificationRate,
        budgetUsed,
        budgetTotal
      }
    });
  } catch (error) {
    logApiError("Error fetching training stats", error);
    return NextResponse.json({ error: "Failed to fetch training stats" }, { status: 500 });
  }
}
