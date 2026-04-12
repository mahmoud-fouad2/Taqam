"use client";

import * as React from "react";
import {
  IconSearch,
  IconFilter,
  IconClock,
  IconLogin,
  IconLogout,
  IconCalendar,
  IconChevronRight,
  IconChevronLeft,
  IconAlertCircle,
  IconCheck,
  IconX
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { TableEmptyRow } from "@/components/empty-states/table-empty-row";
import { Badge } from "@/components/ui/badge";
import {
  type AttendanceRecord,
  type AttendanceStatus,
  attendanceStatusLabels,
  formatTime,
  formatMinutesToHours,
  getStatusColor
} from "@/lib/types/attendance";
import { attendanceService } from "@/lib/api";
import { useEmployees } from "@/hooks/use-employees";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function AttendanceManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { employees, getEmployeeFullName } = useEmployees();
  const [records, setRecords] = React.useState<AttendanceRecord[]>([]);
  const [shifts, setShifts] = React.useState<{ id: string; nameAr?: string; name?: string }[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentEmployeeId, setCurrentEmployeeId] = React.useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = React.useState(true);
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [viewMode, setViewMode] = React.useState<"day" | "month">("month");

  // URL-synced filters
  const statusFilter = (searchParams.get("status") ?? "all") as AttendanceStatus | "all";
  const employeeFilter = searchParams.get("emp") ?? "all";

  const updateFilter = React.useCallback(
    (key: string, value: string) => {
      const p = new URLSearchParams(searchParams.toString());
      if (value === "" || value === "all") p.delete(key);
      else p.set(key, value);
      router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const setStatusFilter = (v: AttendanceStatus | "all") => updateFilter("status", v);
  const setEmployeeFilter = (v: string) => updateFilter("emp", v);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setIsProfileLoading(true);
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        const json = await res.json();
        const employeeId = json?.data?.employee?.id;
        if (mounted) setCurrentEmployeeId(typeof employeeId === "string" ? employeeId : null);
      } catch {
        if (mounted) setCurrentEmployeeId(null);
      } finally {
        if (mounted) setIsProfileLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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

  const fetchMonthData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [recordsRes, shiftsRes] = await Promise.all([
        attendanceService.getRecords({ startDate, endDate }),
        attendanceService.getShifts()
      ]);

      if (recordsRes.success && recordsRes.data) {
        setRecords(recordsRes.data);
      } else {
        setRecords([]);
        setError(recordsRes.error || t.attendance.loadRecordsFailed);
      }

      if (shiftsRes.success && shiftsRes.data) {
        setShifts(shiftsRes.data);
      } else {
        setShifts([]);
      }
    } catch (e) {
      setRecords([]);
      setShifts([]);
      setError(e instanceof Error ? e.message : t.attendance.loadDataFailed);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, t.attendance.loadDataFailed, t.attendance.loadRecordsFailed]);

  React.useEffect(() => {
    fetchMonthData();
  }, [fetchMonthData]);

  // Current month navigation
  const currentMonth = selectedDate.toLocaleString("ar-SA", { month: "long", year: "numeric" });

  // Get days in month
  const daysInMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0
  ).getDate();

  // Navigate month
  const navigateMonth = (direction: number) => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  // Filter records for selected month
  const monthRecords = records.filter((record) => {
    const recordDate = new Date(record.date);
    return (
      recordDate.getMonth() === selectedDate.getMonth() &&
      recordDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  // Apply filters
  const filteredRecords = monthRecords.filter((record) => {
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    const matchesEmployee = employeeFilter === "all" || record.employeeId === employeeFilter;
    return matchesStatus && matchesEmployee;
  });

  // Stats for the month
  const stats = {
    totalWorkDays: monthRecords.filter((r) => !["weekend", "holiday"].includes(r.status)).length,
    present: monthRecords.filter((r) => r.status === "present").length,
    late: monthRecords.filter((r) => r.status === "late").length,
    absent: monthRecords.filter((r) => r.status === "absent").length,
    totalLateMinutes: monthRecords.reduce((sum, r) => sum + (r.lateMinutes || 0), 0),
    avgWorkHours:
      Math.round(
        (monthRecords.reduce((sum, r) => sum + (r.totalWorkMinutes || 0), 0) /
          Math.max(1, monthRecords.filter((r) => r.totalWorkMinutes).length) /
          60) *
          10
      ) / 10
  };

  // Get employee name
  const getEmployeeName = (employeeId: string) => {
    return getEmployeeFullName(employeeId);
  };

  // Get shift name
  const getShiftName = (shiftId: string) => {
    const shift = shifts.find((s) => s.id === shiftId);
    return shift?.nameAr || shift?.name || t.common.unspecified;
  };

  // Format datetime to time
  const formatDateTime = (dateTime: string | undefined) => {
    if (!dateTime) return "-";
    return new Date(dateTime).toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Get status badge
  const StatusBadge = ({ status }: { status: AttendanceStatus }) => {
    const colorClass = getStatusColor(status).replace("bg-", "");
    return (
      <Badge
        variant="outline"
        className={`border-${colorClass} text-${colorClass}`}
        style={{
          borderColor: getStatusColor(status).replace("bg-", "")
        }}>
        <span className={`me-1.5 h-2 w-2 rounded-full ${getStatusColor(status)}`} />
        {attendanceStatusLabels[status].ar}
      </Badge>
    );
  };

  const handleQuickCheckIn = async () => {
    if (isProfileLoading) {
      return;
    }

    if (!currentEmployeeId) {
      setError(t.attendance.notLinked);
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const existingRecord = records.find(
      (r) => r.date === today && r.employeeId === currentEmployeeId
    );

    const getLocation = async (): Promise<{ lat: number; lng: number } | undefined> => {
      if (typeof navigator === "undefined" || !navigator.geolocation) return undefined;
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(undefined),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });
    };

    try {
      setError(null);
      const location = await getLocation();
      if (existingRecord && !existingRecord.checkOutTime) {
        await attendanceService.checkOut({ employeeId: currentEmployeeId, location });
      } else if (!existingRecord) {
        await attendanceService.checkIn({ employeeId: currentEmployeeId, location });
      }
      await fetchMonthData();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.attendance.quickRegisterFailed);
    }
  };

  // Get today's record for current user
  const today = new Date().toISOString().split("T")[0];
  const todayRecord = currentEmployeeId
    ? records.find((r) => r.date === today && r.employeeId === currentEmployeeId)
    : undefined;

  return (
    <div className="space-y-6">
      {error && (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4">
          {error}
        </div>
      )}

      {/* Quick Check-in Card */}
      <Card className="rounded-3xl border-primary/20 bg-primary/5 shadow-[0_2px_10px_0_rgba(0,0,0,0.02)]">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 rounded-full p-3">
                <IconClock className="text-primary h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {new Date().toLocaleDateString("ar-SA", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </h3>
                <p className="text-muted-foreground">
                  {todayRecord?.checkInTime
                    ? `${t.attendance.pClockIn} ${formatDateTime(todayRecord.checkInTime)}`
                    : t.attendance.notCheckedIn}
                  {todayRecord?.checkOutTime &&
                    ` | ${t.attendance.pClockOut} ${formatDateTime(todayRecord.checkOutTime)}`}
                </p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleQuickCheckIn}
              variant={todayRecord?.checkOutTime ? "outline" : "default"}
              disabled={!!todayRecord?.checkOutTime}
              className="h-12 rounded-xl px-5">
              {!todayRecord?.checkInTime ? (
                <>
                  <IconLogin className="ms-2 h-5 w-5" />
                  {t.attendance.pClockIn}
                </>
              ) : !todayRecord?.checkOutTime ? (
                <>
                  <IconLogout className="ms-2 h-5 w-5" />
                  {t.attendance.pClockOut}
                </>
              ) : (
                <>
                  <IconCheck className="ms-2 h-5 w-5" />
                  {t.attendance.pRecorded}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="rounded-3xl border-border/40 bg-card/90 shadow-[0_2px_10px_0_rgba(0,0,0,0.02)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.shifts.workingDays}</CardTitle>
            <IconCalendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWorkDays}</div>
            <p className="text-muted-foreground text-xs">{t.attendance.thisMonthLabel}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-border/40 bg-card/90 shadow-[0_2px_10px_0_rgba(0,0,0,0.02)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.attendance.present}</CardTitle>
            <IconCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <p className="text-muted-foreground text-xs">{t.attendance.day}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-border/40 bg-card/90 shadow-[0_2px_10px_0_rgba(0,0,0,0.02)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.attendance.late}</CardTitle>
            <IconAlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
            <p className="text-muted-foreground text-xs">{t.attendance.day}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-border/40 bg-card/90 shadow-[0_2px_10px_0_rgba(0,0,0,0.02)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.attendance.absent}</CardTitle>
            <IconX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            <p className="text-muted-foreground text-xs">{t.attendance.day}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-border/40 bg-card/90 shadow-[0_2px_10px_0_rgba(0,0,0,0.02)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.attendance.avgWork}</CardTitle>
            <IconClock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.avgWorkHours}</div>
            <p className="text-muted-foreground text-xs">{t.attendance.hourPerDay}</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label={t.common.lastMonth}
            onClick={() => navigateMonth(-1)}>
            <IconChevronRight className="h-4 w-4" />
          </Button>
          <span className="min-w-[150px] text-center font-medium">{currentMonth}</span>
          <Button
            variant="outline"
            size="icon"
            aria-label={t.common.nextMonth}
            onClick={() => navigateMonth(1)}>
            <IconChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={employeeFilter} onValueChange={(value) => setEmployeeFilter(value)}>
            <SelectTrigger className="h-12 w-[180px] rounded-xl">
              <SelectValue placeholder={t.common.employee} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.attendance.allEmployees}</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {getEmployeeFullName(emp.id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as AttendanceStatus | "all")}>
            <SelectTrigger className="h-12 w-[170px] rounded-xl">
              <IconFilter className="ms-2 h-4 w-4" />
              <SelectValue placeholder={t.common.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.attendance.allStatuses}</SelectItem>
              {Object.entries(attendanceStatusLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label.ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Attendance Table */}
      <Card className="rounded-3xl border-border/40 bg-card/90 shadow-[0_2px_10px_0_rgba(0,0,0,0.02)]">
        <CardHeader>
          <CardTitle>{t.attendance.title}</CardTitle>
          <CardDescription>
            {t.attendance.pAttendanceRecordForTheCurrentM}
            {filteredRecords.length} {t.attendance.record})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.common.date}</TableHead>
                <TableHead>{t.common.employee}</TableHead>
                <TableHead>{t.shifts.title}</TableHead>
                <TableHead>{t.attendance.title}</TableHead>
                <TableHead>{t.attendance.departureCol}</TableHead>
                <TableHead>{t.common.status}</TableHead>
                <TableHead>{t.attendance.delay}</TableHead>
                <TableHead>{t.shifts.workHours}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-6">
                    <TableSkeleton columns={8} rows={7} showHeader={false} />
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableEmptyRow
                  colSpan={8}
                  title={t.attendance.noRecordsTitle}
                  description={t.attendance.noRecordsDesc}
                  icon={<IconCalendar className="size-5" />}
                />
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {new Date(record.date).toLocaleDateString("ar-SA", {
                            weekday: "short",
                            day: "numeric"
                          })}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(record.date).toLocaleDateString("ar-SA", {
                            month: "short"
                          })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getEmployeeName(record.employeeId)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getShiftName(record.shiftId)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IconLogin className="h-4 w-4 text-green-500" />
                        <span className="font-mono text-sm">
                          {formatDateTime(record.checkInTime)}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {t.attendance.pExpected} {formatTime(record.expectedCheckIn)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IconLogout className="h-4 w-4 text-red-500" />
                        <span className="font-mono text-sm">
                          {formatDateTime(record.checkOutTime)}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {t.attendance.pExpected} {formatTime(record.expectedCheckOut)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={record.status} />
                    </TableCell>
                    <TableCell>
                      {record.lateMinutes && record.lateMinutes > 0 ? (
                        <span className="font-medium text-yellow-600">
                          {formatMinutesToHours(record.lateMinutes)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.totalWorkMinutes ? (
                        <span className="font-medium">
                          {formatMinutesToHours(record.totalWorkMinutes)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
