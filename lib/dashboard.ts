import prisma from "@/lib/db";

export type DashboardStats = {
  totalEmployees: number;
  activeEmployees: number;
  departments: number;
  todayAttendance: number;
  attendanceRate: number;
  pendingLeaves: number;
  onLeaveToday: number;
  newHiresThisMonth: number;
};

export async function getDashboardStats(tenantId?: string | null): Promise<DashboardStats> {
  // Use UTC date-only values to match @db.Date fields in PostgreSQL
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  const where: { tenantId?: string } = {};
  if (tenantId) where.tenantId = tenantId;

  const [
    totalEmployees,
    activeEmployees,
    departments,
    todayAttendance,
    pendingLeaves,
    onLeaveToday,
    newHiresThisMonth,
  ] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.count({ where: { ...where, status: "ACTIVE" } }),
    prisma.department.count({ where }),
    prisma.attendanceRecord.count({
      where: {
        ...where,
        // AttendanceRecord.date is @db.Date — compare as a date-only value
        date: todayUtc,
      },
    }),
    prisma.leaveRequest.count({ where: { ...where, status: "PENDING" } }),
    prisma.leaveRequest.count({
      where: {
        ...where,
        status: "APPROVED",
        startDate: { lte: todayUtc },
        endDate: { gte: todayUtc },
      },
    }),
    prisma.employee.count({
      where: {
        ...where,
        hireDate: { gte: new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)) },
      },
    }),
  ]);

  const attendanceRate =
    activeEmployees > 0 ? Math.round((todayAttendance / activeEmployees) * 100) : 0;

  return {
    totalEmployees,
    activeEmployees,
    departments,
    todayAttendance,
    attendanceRate,
    pendingLeaves,
    onLeaveToday,
    newHiresThisMonth,
  };
}

export type DashboardActivity = {
  id: string;
  type: "LEAVE_REQUEST" | "CHECK_IN" | "CHECK_OUT" | "ANNOUNCEMENT";
  title: string;
  description: string;
  status?: string;
  priority?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  createdAt: Date;
};

export async function getDashboardActivities(options: {
  tenantId?: string | null;
  limit?: number;
}): Promise<DashboardActivity[]> {
  const { tenantId, limit = 10 } = options;

  const where: { tenantId?: string } = {};
  if (tenantId) where.tenantId = tenantId;

  const [recentLeaves, recentAttendance, recentAnnouncements] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        leaveType: {
          select: {
            name: true,
            nameAr: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.announcement.findMany({
      where: { ...where, isActive: true },
      orderBy: { publishedAt: "desc" },
      take: 5,
    }),
  ]);

  const activities: DashboardActivity[] = [];

  for (const leave of recentLeaves as any[]) {
    activities.push({
      id: leave.id,
      type: "LEAVE_REQUEST",
      title: `Leave Request - ${leave.leaveType?.name}`,
      description: `${leave.employee.firstName} ${leave.employee.lastName} requested ${leave.totalDays} days leave`,
      status: leave.status,
      user: leave.employee,
      createdAt: leave.createdAt,
    });
  }

  for (const att of recentAttendance as any[]) {
    if (att.checkInTime) {
      activities.push({
        id: `${att.id}-in`,
        type: "CHECK_IN",
        title: "Check In",
        description: `${att.employee.firstName} ${att.employee.lastName} checked in`,
        user: att.employee,
        createdAt: att.checkInTime,
      });
    }
    if (att.checkOutTime) {
      activities.push({
        id: `${att.id}-out`,
        type: "CHECK_OUT",
        title: "Check Out",
        description: `${att.employee.firstName} ${att.employee.lastName} checked out`,
        user: att.employee,
        createdAt: att.checkOutTime,
      });
    }
  }

  for (const announcement of recentAnnouncements as any[]) {
    activities.push({
      id: announcement.id,
      type: "ANNOUNCEMENT",
      title: announcement.title,
      description:
        announcement.content.substring(0, 100) +
        (announcement.content.length > 100 ? "..." : ""),
      priority: announcement.priority,
      createdAt: announcement.publishedAt || announcement.createdAt,
    });
  }

  activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return activities.slice(0, limit);
}

export type DashboardAttendancePoint = {
  date: string;
  present: number;
  absent: number;
  late: number;
};

export type DashboardPiePoint = {
  name: string;
  nameAr?: string | null;
  value: number;
};

export type DashboardCharts = {
  attendance: DashboardAttendancePoint[];
  departments: DashboardPiePoint[];
  leaves: DashboardPiePoint[];
};

export type DashboardChartPeriod = "week" | "month" | "year";

export async function getDashboardCharts(options: {
  tenantId?: string | null;
  period?: DashboardChartPeriod;
}): Promise<DashboardCharts> {
  const { tenantId, period = "week" } = options;

  const where: { tenantId?: string } = {};
  if (tenantId) where.tenantId = tenantId;

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const attendanceData = await prisma.attendanceRecord.findMany({
    where: {
      ...where,
      date: { gte: startDate },
    },
    select: {
      date: true,
      status: true,
    },
  });

  const attendanceByDate: Record<string, { present: number; absent: number; late: number }> = {};

  for (const att of attendanceData as any[]) {
    const dateKey = att.date.toISOString().split("T")[0];
    if (!attendanceByDate[dateKey]) {
      attendanceByDate[dateKey] = { present: 0, absent: 0, late: 0 };
    }

    if (att.status === "PRESENT") attendanceByDate[dateKey].present++;
    else if (att.status === "ABSENT") attendanceByDate[dateKey].absent++;
    else if (att.status === "LATE") attendanceByDate[dateKey].late++;
  }

  const employeesByDepartment = await prisma.department.findMany({
    where,
    include: {
      _count: {
        select: { employees: true },
      },
    },
  });

  const departments = (employeesByDepartment as any[])
    .filter((dept) => dept._count.employees > 0)
    .map((dept) => ({
      name: dept.name,
      nameAr: dept.nameAr,
      value: dept._count.employees,
    }));

  const leavesByType = await prisma.leaveRequest.groupBy({
    by: ["leaveTypeId"],
    where: {
      ...where,
      status: "APPROVED",
      startDate: { gte: startDate },
    },
    _count: {
      id: true,
    },
  });

  const leaveTypes = await prisma.leaveType.findMany({
    where: { id: { in: leavesByType.map((l) => l.leaveTypeId) } },
  });

  const leaves = leavesByType.map((item) => {
    const leaveType = leaveTypes.find((lt) => lt.id === item.leaveTypeId);
    return {
      name: leaveType?.name || "Unknown",
      nameAr: leaveType?.nameAr || "غير معروف",
      value: item._count.id,
    };
  });

  return {
    attendance: Object.entries(attendanceByDate).map(([date, counts]) => ({
      date,
      ...counts,
    })),
    departments,
    leaves,
  };
}
