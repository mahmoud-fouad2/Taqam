"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  IconArrowRight,
  IconArrowLeft,
  IconPencil,
  IconTrash,
  IconMail,
  IconPhone,
  IconCalendar,
  IconBriefcase,
  IconBuilding,
  IconId,
  IconClock,
} from "@tabler/icons-react";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  employee: {
    id: string;
    employeeNumber: string | null;
    hireDate: string | null;
    department: { name: string; nameAr: string | null } | null;
    jobTitle: { name: string; nameAr: string | null } | null;
  } | null;
}

interface Props {
  user: UserData;
  locale: "ar" | "en";
}

export default function UserDetailsClient({ user, locale: _locale }: Props) {
  const locale = useClientLocale();
  const t = getText(locale);
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? IconArrowRight : IconArrowLeft;

  const statusLabel = (status: string) => {
    if (!isRtl) return status;
    if (status === "ACTIVE") return t.common.active;
    if (status === "PENDING_VERIFICATION") return t.common.pendingActivation;
    if (status === "INACTIVE") return t.common.inactive;
    if (status === "SUSPENDED") return t.common.suspended;
    return status;
  };

  const roleLabel = (role: string) => {
    if (!isRtl) return role;
    if (role === "SUPER_ADMIN") return "مدير النظام";
    if (role === "TENANT_ADMIN") return t.common.companyAdmin;
    if (role === "HR_MANAGER") return t.common.hrManager;
    if (role === "MANAGER") return t.common.manager;
    if (role === "EMPLOYEE") return t.common.employee;
    return role;
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "-";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString(isRtl ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (iso: string | null) => {
    if (!iso) return "-";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString(isRtl ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "فشل في حذف المستخدم");
      }

      toast.success(isRtl ? "تم حذف المستخدم بنجاح" : "User deleted successfully");
      router.push("/dashboard/users");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || (isRtl ? "فشل في حذف المستخدم" : "Failed to delete user"));
    } finally {
      setIsDeleting(false);
    }
  };

  const statusVariant = (status: string) => {
    if (status === "ACTIVE") return "bg-green-100 text-green-700";
    if (status === "PENDING_VERIFICATION") return "bg-orange-100 text-orange-700";
    if (status === "INACTIVE") return "bg-gray-100 text-gray-700";
    if (status === "SUSPENDED") return "bg-red-100 text-red-700";
    return "";
  };

  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label={t.common.back} asChild>
            <Link href="/dashboard/users">
              <ArrowIcon className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isRtl ? "تفاصيل المستخدم" : "User Details"}
            </h1>
            <p className="text-muted-foreground">{fullName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/users/${user.id}/edit`}>
              <IconPencil className="h-4 w-4 me-2" />
              {isRtl ? t.common.edit : "Edit"}
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <IconTrash className="h-4 w-4 me-2" />
                {isRtl ? t.common.delete : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {isRtl ? t.common.areYouSure : "Are you sure?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isRtl
                    ? `سيتم حذف المستخدم "${fullName}" نهائياً. لا يمكن التراجع عن هذا الإجراء.`
                    : `User "${fullName}" will be permanently deleted. This action cannot be undone.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{isRtl ? t.common.cancel : "Cancel"}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting
                    ? isRtl
                      ? t.common.deleting
                      : "Deleting..."
                    : isRtl
                    ? t.common.delete
                    : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.avatar || undefined} alt={fullName} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{fullName}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex gap-2 mt-4">
                <Badge className={statusVariant(user.status)}>{statusLabel(user.status)}</Badge>
                <Badge variant="outline">{roleLabel(user.role)}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{isRtl ? "معلومات الحساب" : "Account Information"}</CardTitle>
            <CardDescription>
              {isRtl ? "تفاصيل حساب المستخدم" : "User account details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                  <IconMail className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isRtl ? t.common.email : "Email"}
                  </p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                  <IconPhone className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isRtl ? t.common.phone : "Phone"}
                  </p>
                  <p className="font-medium">{user.phone || "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                  <IconCalendar className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isRtl ? "تاريخ الإنشاء" : "Created At"}
                  </p>
                  <p className="font-medium">{formatDate(user.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                  <IconClock className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isRtl ? "آخر تسجيل دخول" : "Last Login"}
                  </p>
                  <p className="font-medium">{formatDateTime(user.lastLoginAt)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Info (if linked) */}
        {user.employee && (
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>{isRtl ? "معلومات الموظف" : "Employee Information"}</CardTitle>
              <CardDescription>
                {isRtl ? "البيانات الوظيفية المرتبطة" : "Linked employee data"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                    <IconId className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isRtl ? t.employees.employeeNumber : "Employee Number"}
                    </p>
                    <p className="font-medium">{user.employee.employeeNumber || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                    <IconBuilding className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isRtl ? t.common.department : "Department"}
                    </p>
                    <p className="font-medium">
                      {isRtl
                        ? user.employee.department?.nameAr || user.employee.department?.name || "-"
                        : user.employee.department?.name || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                    <IconBriefcase className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isRtl ? t.common.jobTitle : "Job Title"}
                    </p>
                    <p className="font-medium">
                      {isRtl
                        ? user.employee.jobTitle?.nameAr || user.employee.jobTitle?.name || "-"
                        : user.employee.jobTitle?.name || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                    <IconCalendar className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isRtl ? t.common.hireDate : "Hire Date"}
                    </p>
                    <p className="font-medium">{formatDate(user.employee.hireDate)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
