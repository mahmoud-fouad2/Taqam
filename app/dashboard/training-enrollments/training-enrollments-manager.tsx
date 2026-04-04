"use client";

import * as React from "react";
import {
  IconSearch,
  IconFilter,
  IconUser,
  IconBook,
  IconCertificate,
  IconProgress,
  IconCheck,
  IconX,
  IconDownload,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  CourseEnrollment,
  EnrollmentStatus,
  enrollmentStatusLabels,
  enrollmentStatusColors,
} from "@/lib/types/training";

export function TrainingEnrollmentsManager() {
  const [enrollments, setEnrollments] = React.useState<CourseEnrollment[]>([]);
  const [courses, setCourses] = React.useState<Array<{ id: string; title: string }>>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [courseFilter, setCourseFilter] = React.useState<string>("all");

  const refresh = React.useCallback(async () => {
    try {
      const [enrollmentsRes, coursesRes] = await Promise.all([
        fetch("/api/training/enrollments", { cache: "no-store" }),
        fetch("/api/training/courses", { cache: "no-store" }),
      ]);

      if (!enrollmentsRes.ok) {
        const err = await enrollmentsRes.json().catch(() => null);
        throw new Error(err?.error || "Failed to fetch enrollments");
      }
      if (!coursesRes.ok) {
        const err = await coursesRes.json().catch(() => null);
        throw new Error(err?.error || "Failed to fetch courses");
      }

      const enrollmentsJson = await enrollmentsRes.json();
      const coursesJson = await coursesRes.json();

      setEnrollments((enrollmentsJson?.data?.enrollments ?? []) as CourseEnrollment[]);
      setCourses(
        ((coursesJson?.data?.courses ?? []) as Array<{ id: string; title: string }>).map((c) => ({
          id: c.id,
          title: c.title,
        }))
      );
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "فشل تحميل تسجيلات التدريب");
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  // فلترة التسجيلات
  const filteredEnrollments = React.useMemo(() => {
    return enrollments.filter((enrollment) => {
      const matchesSearch =
        enrollment.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enrollment.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || enrollment.status === statusFilter;

      const matchesCourse =
        courseFilter === "all" || enrollment.courseId === courseFilter;

      return matchesSearch && matchesStatus && matchesCourse;
    });
  }, [enrollments, searchQuery, statusFilter, courseFilter]);

  // إحصائيات
  const stats = React.useMemo(() => ({
    total: enrollments.length,
    inProgress: enrollments.filter((e) => e.status === "in-progress").length,
    completed: enrollments.filter((e) => e.status === "completed").length,
    pending: enrollments.filter((e) => e.status === "pending").length,
  }), [enrollments]);

  const handleStatusChange = async (enrollmentId: string, newStatus: EnrollmentStatus) => {
    try {
      const res = await fetch(`/api/training/enrollments/${enrollmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to update enrollment");
      }

      setEnrollments((prev) =>
        prev.map((e) => (e.id === enrollmentId ? { ...e, status: newStatus } : e))
      );
      toast.success("تم تحديث الحالة");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "فشل تحديث الحالة");
    }
  };

  return (
    <div className="space-y-6">
      {/* بطاقات الإحصائيات */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التسجيلات</CardTitle>
            <IconUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">تسجيل</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">بانتظار الموافقة</CardTitle>
            <IconProgress className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">طلب تسجيل</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">قيد التدريب</CardTitle>
            <IconBook className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">يتدربون حالياً</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">أتموا التدريب</CardTitle>
            <IconCertificate className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">متدرب</p>
          </CardContent>
        </Card>
      </div>

      {/* جدول التسجيلات */}
      <Card>
        <CardHeader>
          <CardTitle>تسجيلات التدريب</CardTitle>
          <CardDescription>متابعة تسجيلات الموظفين في الدورات التدريبية</CardDescription>
        </CardHeader>
        <CardContent>
          {/* أدوات البحث والفلترة */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row">
            <div className="relative flex-1">
              <IconSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="الدورة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الدورات</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <IconFilter className="ms-2 h-4 w-4" />
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {Object.entries(enrollmentStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* جدول التسجيلات */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الموظف</TableHead>
                  <TableHead>الدورة</TableHead>
                  <TableHead>القسم</TableHead>
                  <TableHead>التقدم</TableHead>
                  <TableHead>الدرجة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-start">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">لا توجد تسجيلات</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEnrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={enrollment.employeeAvatar} alt="" />
                            <AvatarFallback>
                              {enrollment.employeeName.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{enrollment.employeeName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{enrollment.courseTitle}</TableCell>
                      <TableCell>{enrollment.departmentName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 w-24">
                          <Progress value={enrollment.progress} className="h-2" />
                          <span className="text-xs text-muted-foreground">
                            {enrollment.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {enrollment.score !== undefined ? (
                          <div>
                            <span className="font-medium">{enrollment.score}</span>
                            {enrollment.grade && (
                              <span className="text-muted-foreground text-xs me-1">
                                ({enrollment.grade})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={enrollmentStatusColors[enrollment.status]}>
                          {enrollmentStatusLabels[enrollment.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              •••
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {enrollment.status === "pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(enrollment.id, "approved")}
                                >
                                  <IconCheck className="ms-2 h-4 w-4" />
                                  الموافقة
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleStatusChange(enrollment.id, "rejected")}
                                >
                                  <IconX className="ms-2 h-4 w-4" />
                                  رفض
                                </DropdownMenuItem>
                              </>
                            )}
                            {enrollment.certificate && (
                              <DropdownMenuItem>
                                <IconDownload className="ms-2 h-4 w-4" />
                                تحميل الشهادة
                              </DropdownMenuItem>
                            )}
                            {enrollment.status === "in-progress" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(enrollment.id, "completed")}
                              >
                                <IconCheck className="ms-2 h-4 w-4" />
                                إكمال التدريب
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
