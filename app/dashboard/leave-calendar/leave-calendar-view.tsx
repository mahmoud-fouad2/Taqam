"use client";

import { useEffect, useMemo, useState } from "react";
import {
  IconChevronRight,
  IconChevronLeft,
  IconCalendar,
  IconFilter,
  IconDownload,
  IconBeach,
  IconFirstAidKit,
  IconUsers,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LeaveRequestStatus,
} from "@/lib/types/leave";
import { useEmployees } from "@/hooks/use-employees";
import { leavesApi } from "@/lib/api";
import { getLeaveTheme } from "@/lib/ui/leave-color";

type UiLeaveStatus = Exclude<LeaveRequestStatus, "taken">;

const statusLabels: Record<UiLeaveStatus | "all", string> = {
  all: "جميع الحالات",
  pending: "قيد الانتظار",
  approved: "موافق عليها",
  rejected: "مرفوض",
  cancelled: "ملغي",
};

function pickLeaveBgClass(color?: string | null): string {
  return getLeaveTheme(color).bg;
}

type CalendarEvent = {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentId: string;
  leaveTypeId: string;
  leaveTypeName: string;
  color: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: UiLeaveStatus;
};

function toYmd(value: any): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toLocalDateFromYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function mapStatusFromApi(value: any): UiLeaveStatus {
  switch (String(value)) {
    case "APPROVED":
      return "approved";
    case "REJECTED":
      return "rejected";
    case "CANCELLED":
      return "cancelled";
    case "PENDING":
    default:
      return "pending";
  }
}

// أسماء الأشهر بالعربية
const monthNames = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

// أسماء الأيام بالعربية
const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function LeaveCalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<UiLeaveStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const { departments, isLoading: isEmployeesLoading, error: employeesError } = useEmployees();

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadEvents = async (year: number) => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const res = await leavesApi.requests.getAll({ limit: 1000, year });
      if (!res.success) {
        throw new Error(res.error || "فشل تحميل الإجازات");
      }

      const mapped: CalendarEvent[] = Array.isArray(res.data)
        ? (res.data as any[])
            .map((r: any) => {
              const employeeName = r?.employee
                ? `${String(r.employee.firstName ?? "")} ${String(r.employee.lastName ?? "")}`.trim()
                : "";

              return {
                id: String(r.id),
                employeeId: String(r.employeeId ?? ""),
                employeeName,
                departmentId: String(r.employee?.departmentId ?? ""),
                leaveTypeId: String(r.leaveTypeId ?? ""),
                leaveTypeName: String(r.leaveType?.name ?? ""),
                color: String(r.leaveType?.color ?? "#6B7280"),
                startDate: toYmd(r.startDate),
                endDate: toYmd(r.endDate),
                status: mapStatusFromApi(r.status),
              };
            })
            .filter((e: CalendarEvent) => Boolean(e.startDate) && Boolean(e.endDate))
        : [];

      // Keep same behavior: hide rejected/cancelled by default in the calendar grid
      setCalendarEvents(mapped.filter((e) => e.status !== "rejected" && e.status !== "cancelled"));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "فشل تحميل الإجازات");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents(currentDate.getFullYear());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate.getFullYear()]);

  // Filter events
  const filteredEvents = calendarEvents.filter((event) => {
    if (filterStatus !== "all" && event.status !== filterStatus) return false;
    if (filterDepartment !== "all" && event.departmentId !== filterDepartment) return false;
    return true;
  });

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the 1st
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter((event) => {
      const eventStart = toLocalDateFromYmd(event.startDate);
      const eventEnd = toLocalDateFromYmd(event.endDate);
      const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      return checkDate >= eventStart && checkDate <= eventEnd;
    });
  };

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is weekend
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 5 || day === 6; // Friday & Saturday
  };

  // Stats
  const stats = {
    onLeaveToday: filteredEvents.filter((e) => {
      const today = new Date();
      const start = toLocalDateFromYmd(e.startDate);
      const end = toLocalDateFromYmd(e.endDate);
      return today >= start && today <= end && e.status === "approved";
    }).length,
    upcomingLeaves: filteredEvents.filter((e) => {
      const today = new Date();
      const start = toLocalDateFromYmd(e.startDate);
      return start > today && e.status === "approved";
    }).length,
    pendingApprovals: filteredEvents.filter((e) => e.status === "pending").length,
  };

  const legendItems = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    for (const e of filteredEvents) {
      if (!e.leaveTypeId) continue;
      if (!map.has(e.leaveTypeId)) {
        map.set(e.leaveTypeId, { name: e.leaveTypeName || "نوع إجازة", color: e.color });
      }
    }
    return Array.from(map.values()).slice(0, 12);
  }, [filteredEvents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">تقويم الإجازات</h2>
          <p className="text-muted-foreground">عرض جميع الإجازات في التقويم</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <IconDownload className="ms-2 h-4 w-4" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardDescription>في إجازة اليوم</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl text-blue-600">
              <IconBeach className="h-8 w-8" />
              {stats.onLeaveToday}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardDescription>إجازات قادمة</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl text-green-600">
              <IconCalendar className="h-8 w-8" />
              {stats.upcomingLeaves}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardDescription>بانتظار الموافقة</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl text-yellow-600">
              <IconUsers className="h-8 w-8" />
              {stats.pendingApprovals}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Month Navigation */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" aria-label="الشهر السابق" onClick={goToPreviousMonth}>
                <IconChevronRight className="h-5 w-5" />
              </Button>
              <h3 className="text-xl font-semibold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <Button variant="ghost" size="icon" aria-label="الشهر التالي" onClick={goToNextMonth}>
                <IconChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                اليوم
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="جميع الأقسام" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأقسام</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as UiLeaveStatus | "all")}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{statusLabels.all}</SelectItem>
                  <SelectItem value="pending">{statusLabels.pending}</SelectItem>
                  <SelectItem value="approved">{statusLabels.approved}</SelectItem>
                  <SelectItem value="rejected">{statusLabels.rejected}</SelectItem>
                  <SelectItem value="cancelled">{statusLabels.cancelled}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {employeesError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {employeesError}
            </div>
          )}
          {loadError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {loadError}
            </div>
          )}

          {isLoading || isEmployeesLoading ? (
            <div className="py-10 text-center text-muted-foreground">جارٍ التحميل...</div>
          ) : (
            <>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-px mb-2">
                {dayNames.map((day, index) => (
                  <div
                    key={day}
                    className={`p-2 text-center text-sm font-medium ${
                      index === 5 || index === 6 ? "text-red-600" : "text-muted-foreground"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-px rounded-lg border bg-muted">
                {days.map((date, index) => {
                  if (!date) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="min-h-[120px] bg-background p-2"
                      />
                    );
                  }

                  const events = getEventsForDate(date);
                  const weekend = isWeekend(date);
                  const today = isToday(date);

                  return (
                    <div
                      key={date.toISOString()}
                      className={`min-h-[120px] bg-background p-2 transition-colors ${
                        weekend ? "bg-gray-50" : ""
                      } ${today ? "ring-2 ring-primary ring-inset" : ""}`}
                    >
                      {/* Date Number */}
                      <div
                        className={`mb-1 text-sm font-medium ${
                          today
                            ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                            : weekend
                              ? "text-red-600"
                              : ""
                        }`}
                      >
                        {date.getDate()}
                      </div>

                      {/* Events */}
                      <div className="space-y-1">
                        <TooltipProvider>
                          {events.slice(0, 3).map((event) => (
                            <Tooltip key={event.id}>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "truncate rounded px-1.5 py-0.5 text-xs text-white cursor-pointer",
                                    pickLeaveBgClass(event.color)
                                  )}
                                >
                                  {event.employeeName}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-xs">
                                <div className="space-y-1">
                                  <p className="font-medium">{event.employeeName}</p>
                                  <p className="text-sm">{event.leaveTypeName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {toLocalDateFromYmd(event.startDate).toLocaleDateString("ar-SA")} -{" "}
                                    {toLocalDateFromYmd(event.endDate).toLocaleDateString("ar-SA")}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className={
                                      event.status === "approved"
                                        ? "bg-green-100 text-green-800"
                                        : event.status === "pending"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : event.status === "rejected"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-gray-100 text-gray-800"
                                    }
                                  >
                                    {statusLabels[event.status]}
                                  </Badge>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                          {events.length > 3 && (
                            <div className="text-xs text-muted-foreground text-center">
                              +{events.length - 3} المزيد
                            </div>
                          )}
                        </TooltipProvider>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">دليل الألوان</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {legendItems.length === 0 ? (
              <span className="text-sm text-muted-foreground">لا توجد بيانات لعرضها</span>
            ) : (
              legendItems.map((item) => (
                <div key={`${item.name}-${item.color}`} className="flex items-center gap-2">
                  <div className={cn("h-4 w-4 rounded", pickLeaveBgClass(item.color))} />
                  <span className="text-sm">{item.name}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today's Leaves */}
      <Card>
        <CardHeader>
          <CardTitle>في إجازة اليوم</CardTitle>
          <CardDescription>الموظفون الذين في إجازة حالياً</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.onLeaveToday === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              لا يوجد موظفون في إجازة اليوم
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents
                .filter((e) => {
                  const today = new Date();
                  const start = toLocalDateFromYmd(e.startDate);
                  const end = toLocalDateFromYmd(e.endDate);
                  return today >= start && today <= end;
                })
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <Avatar>
                      <AvatarFallback>{event.employeeName.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{event.employeeName}</p>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn("h-2 w-2 rounded-full", pickLeaveBgClass(event.color))}
                        />
                        <span className="text-sm text-muted-foreground">
                          {event.leaveTypeName}
                        </span>
                      </div>
                    </div>
                    <div className="text-start text-sm text-muted-foreground">
                      حتى {toLocalDateFromYmd(event.endDate).toLocaleDateString("ar-SA")}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
