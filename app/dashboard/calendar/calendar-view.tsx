"use client";

import * as React from "react";
import {
  IconChevronRight,
  IconChevronLeft,
  IconCalendar,
  IconCheck,
  IconX,
  IconClock,
  IconAlertCircle,
  IconBeach,
  IconMoon
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  type AttendanceRecord,
  type AttendanceStatus,
  type Holiday,
  attendanceStatusLabels,
  dayNames,
  getStatusColor
} from "@/lib/types/attendance";
import { attendanceService } from "@/lib/api";
import { useEmployees } from "@/hooks/use-employees";
import { useAttendance } from "@/hooks/use-attendance";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function CalendarView() {
  const locale = useClientLocale();
  const t = getText(locale);
  const { employees, getEmployeeFullName } = useEmployees();
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = React.useState<string>("");
  const [holidays, setHolidays] = React.useState<Holiday[]>([]);

  React.useEffect(() => {
    if (!selectedEmployee && employees.length > 0) {
      setSelectedEmployee(employees[0].id);
    }
  }, [employees, selectedEmployee]);

  // Get current month data
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  const startDate = React.useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}-01`;
  }, [selectedDate]);

  const endDate = React.useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth();
    const last = new Date(y, m + 1, 0).getDate();
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  }, [selectedDate]);

  const {
    records,
    isLoading: isRecordsLoading,
    error: recordsError,
    refetch
  } = useAttendance({ employeeId: selectedEmployee || undefined, startDate, endDate });

  React.useEffect(() => {
    if (selectedEmployee) {
      refetch();
    }
  }, [selectedEmployee, startDate, endDate, refetch]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await attendanceService.getHolidays(year);
      if (!mounted) return;
      if (res.success && res.data) {
        setHolidays(res.data);
      } else {
        setHolidays([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [year]);

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Navigate month
  const navigateMonth = (direction: number) => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  // Get attendance for a specific day
  const getAttendanceForDay = (day: number): AttendanceRecord | undefined => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return records.find((r) => r.date === dateStr && r.employeeId === selectedEmployee);
  };

  // Check if day is holiday
  const isHoliday = (day: number): boolean => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return holidays.some((h) => {
      if (h.endDate) {
        return dateStr >= h.date && dateStr <= h.endDate;
      }
      return h.date === dateStr;
    });
  };

  // Get holiday name
  const getHolidayName = (day: number): string | null => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const holiday = holidays.find((h) => {
      if (h.endDate) {
        return dateStr >= h.date && dateStr <= h.endDate;
      }
      return h.date === dateStr;
    });
    return holiday?.nameAr || null;
  };

  // Generate calendar grid
  const calendarDays: (number | null)[] = [];

  // Add empty cells for days before the first day of month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Stats for the month
  const monthRecords = records;

  const stats = {
    present: monthRecords.filter((r) => r.status === "present").length,
    late: monthRecords.filter((r) => r.status === "late").length,
    absent: monthRecords.filter((r) => r.status === "absent").length,
    onLeave: monthRecords.filter((r) => r.status === "on_leave").length
  };

  // Get status icon
  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return <IconCheck className="h-3 w-3" />;
      case "late":
        return <IconClock className="h-3 w-3" />;
      case "absent":
        return <IconX className="h-3 w-3" />;
      case "on_leave":
        return <IconBeach className="h-3 w-3" />;
      case "holiday":
        return <IconAlertCircle className="h-3 w-3" />;
      case "weekend":
        return <IconMoon className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="space-y-6">
      {recordsError && (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4">
          {recordsError}
        </div>
      )}
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.attendance.present}</CardTitle>
            <IconCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <p className="text-muted-foreground text-xs">{t.attendance.day}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.attendance.late}</CardTitle>
            <IconClock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
            <p className="text-muted-foreground text-xs">{t.attendance.day}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.attendance.absent}</CardTitle>
            <IconX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            <p className="text-muted-foreground text-xs">{t.attendance.day}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.calendar.leaves}</CardTitle>
            <IconBeach className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.onLeave}</div>
            <p className="text-muted-foreground text-xs">{t.attendance.day}</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t.calendar.attendanceCalendar}</CardTitle>
              <CardDescription>{t.calendar.monthlyView}</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {getEmployeeFullName(emp.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={t.common.lastMonth}
                  onClick={() => navigateMonth(-1)}>
                  <IconChevronRight className="h-4 w-4" />
                </Button>
                <span className="min-w-[150px] text-center font-medium">
                  {selectedDate.toLocaleString("ar-SA", { month: "long", year: "numeric" })}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={t.common.nextMonth}
                  onClick={() => navigateMonth(1)}>
                  <IconChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {dayNames.ar.map((day, index) => (
              <div
                key={index}
                className={`py-2 text-center text-sm font-medium ${
                  index === 5 || index === 6 ? "text-red-500" : "text-muted-foreground"
                }`}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={index} className="h-20" />;
              }

              const attendance = getAttendanceForDay(day);
              const holiday = isHoliday(day);
              const holidayName = getHolidayName(day);
              const dayOfWeek = (startingDayOfWeek + day - 1) % 7;
              const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

              return (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`hover:border-primary/50 h-20 cursor-pointer rounded-lg border p-2 transition-colors ${
                          isToday(day)
                            ? "border-primary bg-primary/5"
                            : holiday
                              ? "border-purple-200 bg-purple-50"
                              : isWeekend
                                ? "bg-gray-50"
                                : ""
                        }`}>
                        <div className="flex items-start justify-between">
                          <span
                            className={`text-sm font-medium ${
                              isToday(day) ? "text-primary" : isWeekend ? "text-red-500" : ""
                            }`}>
                            {day}
                          </span>
                          {attendance && (
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${getStatusColor(
                                attendance.status
                              )}`}>
                              {getStatusIcon(attendance.status)}
                            </div>
                          )}
                        </div>
                        {holiday && (
                          <p className="mt-1 truncate text-xs text-purple-600">{holidayName}</p>
                        )}
                        {attendance?.checkInTime && (
                          <p className="text-muted-foreground mt-1 text-xs">
                            {new Date(attendance.checkInTime).toLocaleTimeString("ar-SA", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      {attendance ? (
                        <div className="space-y-1">
                          <p className="font-medium">
                            {attendanceStatusLabels[attendance.status].ar}
                          </p>
                          {attendance.checkInTime && (
                            <p className="text-xs">
                              {t.calendar.pCheckin}{" "}
                              {new Date(attendance.checkInTime).toLocaleTimeString("ar-SA", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </p>
                          )}
                          {attendance.checkOutTime && (
                            <p className="text-xs">
                              {t.calendar.pClockOut}{" "}
                              {new Date(attendance.checkOutTime).toLocaleTimeString("ar-SA", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </p>
                          )}
                          {attendance.lateMinutes && attendance.lateMinutes > 0 && (
                            <p className="text-xs text-yellow-600">
                              {t.calendar.pLate} {attendance.lateMinutes} {t.calendar.minuteUnit}
                            </p>
                          )}
                        </div>
                      ) : holiday ? (
                        <p>{holidayName}</p>
                      ) : isWeekend ? (
                        <p>{t.calendar.weeklyHoliday}</p>
                      ) : (
                        <p>{isRecordsLoading ? t.common.loading : t.calendar.noRecord}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center gap-4 border-t pt-4">
            <span className="text-muted-foreground text-sm">{t.calendar.colorGuide}</span>
            {[
              { status: "present", label: t.calendar.present },
              { status: "late", label: t.calendar.late },
              { status: "absent", label: t.calendar.absent },
              { status: "on_leave", label: t.calendar.onLeave },
              { status: "holiday", label: t.calendar.officialHoliday },
              { status: "weekend", label: t.calendar.weekendHoliday }
            ].map(({ status, label }) => (
              <div key={status} className="flex items-center gap-1.5">
                <div
                  className={`h-3 w-3 rounded-full ${getStatusColor(status as AttendanceStatus)}`}
                />
                <span className="text-xs">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
