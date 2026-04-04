"use client";

import * as React from "react";
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconCheck,
  IconProgress,
  IconAlertCircle,
  IconClipboardList,
  IconMail,
  IconUsers,
  IconRefresh,
  IconFileText,
  IconTrash,
  IconEdit,
  IconLoader,
  IconTemplate,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Types
interface OnboardingTask {
  id: string;
  title: string;
  description?: string;
  category?: string;
  dueDate?: string;
  assigneeId?: string;
  isCompleted: boolean;
  completedAt?: string | null;
}

interface OnboardingDocument {
  id: string;
  name: string;
  type?: string;
  isRequired: boolean;
  isSubmitted: boolean;
  submittedAt?: string | null;
  fileUrl?: string;
}

interface OnboardingProcess {
  id: string;
  employeeId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  startDate: string;
  endDate?: string;
  tasks: OnboardingTask[];
  documents: OnboardingDocument[];
  progress: number;
  notes?: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    firstNameAr?: string;
    lastNameAr?: string;
    employeeNumber?: string;
    avatar?: string;
    department?: { name: string; nameAr?: string };
    jobTitle?: { name: string; nameAr?: string };
    manager?: {
      firstName: string;
      lastName: string;
      firstNameAr?: string;
      lastNameAr?: string;
      email: string;
    };
  };
  template?: {
    id: string;
    name: string;
    description?: string;
    durationDays: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface OnboardingTemplate {
  id: string;
  name: string;
  description?: string;
  durationDays: number;
  tasks: any[];
  documents: any[];
  isActive: boolean;
  department?: { name: string; nameAr?: string };
  jobTitle?: { name: string; nameAr?: string };
  _count?: { processes: number };
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  firstNameAr?: string;
  lastNameAr?: string;
  employeeNumber?: string;
  department?: { name: string; nameAr?: string };
  jobTitle?: { name: string; nameAr?: string };
}

interface APIResponse {
  processes: OnboardingProcess[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    total: number;
    notStarted: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
}

// Status helpers
const statusLabels: Record<string, string> = {
  NOT_STARTED: "لم يبدأ",
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
};

const statusColors: Record<string, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const taskCategoryLabels: Record<string, string> = {
  documentation: "المستندات",
  "system-access": "صلاحيات النظام",
  training: "التدريب",
  introduction: "التعريف",
  equipment: "المعدات",
  other: "أخرى",
};

export function OnboardingManagerNew() {
  const [processes, setProcesses] = React.useState<OnboardingProcess[]>([]);
  const [templates, setTemplates] = React.useState<OnboardingTemplate[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [stats, setStats] = React.useState({
    total: 0,
    notStarted: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [selectedProcess, setSelectedProcess] = React.useState<OnboardingProcess | null>(null);
  const [isViewSheetOpen, setIsViewSheetOpen] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = React.useState(false);
  const [deleteProcessId, setDeleteProcessId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("processes");

  // Form state for new process
  const [newProcess, setNewProcess] = React.useState({
    employeeId: "",
    templateId: "",
    startDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Form state for new template
  const [newTemplate, setNewTemplate] = React.useState({
    name: "",
    description: "",
    durationDays: 30,
    tasks: [] as any[],
    documents: [] as any[],
    isActive: true,
  });

  // Fetch data
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);

      const [processesRes, templatesRes, employeesRes] = await Promise.all([
        fetch(`/api/onboarding?${params.toString()}`),
        fetch("/api/onboarding/templates?isActive=true"),
        fetch("/api/employees?limit=100"),
      ]);

      if (processesRes.ok) {
        const data: APIResponse = await processesRes.json();
        setProcesses(data.processes);
        setStats(data.stats);
      }

      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates(data.templates || []);
      }

      if (employeesRes.ok) {
        const data = await employeesRes.json();
        setEmployees(data.employees || data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("حدث خطأ في جلب البيانات");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter processes
  const filteredProcesses = React.useMemo(() => {
    return processes.filter((process) => {
      const employeeName = `${process.employee.firstNameAr || process.employee.firstName} ${process.employee.lastNameAr || process.employee.lastName}`;
      const matchesSearch =
        employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (process.employee.jobTitle?.nameAr || process.employee.jobTitle?.name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [processes, searchQuery]);

  // Create process
  const handleCreateProcess = async () => {
    if (!newProcess.employeeId) {
      toast.error("يرجى اختيار الموظف");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProcess),
      });

      if (res.ok) {
        toast.success("تم بدء عملية الإلحاق بنجاح");
        setIsAddDialogOpen(false);
        setNewProcess({
          employeeId: "",
          templateId: "",
          startDate: new Date().toISOString().split("T")[0],
          notes: "",
        });
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || "حدث خطأ في بدء عملية الإلحاق");
      }
    } catch (error) {
      toast.error("حدث خطأ في الاتصال");
    } finally {
      setSubmitting(false);
    }
  };

  // Update task completion
  const handleTaskStatusChange = async (processId: string, taskId: string, completed: boolean) => {
    const process = processes.find((p) => p.id === processId);
    if (!process) return;

    const updatedTasks = process.tasks.map((t) =>
      t.id === taskId
        ? { ...t, isCompleted: completed, completedAt: completed ? new Date().toISOString() : null }
        : t
    );

    try {
      const res = await fetch(`/api/onboarding/${processId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: updatedTasks }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update local state
        setProcesses(processes.map((p) => (p.id === processId ? data.process : p)));
        if (selectedProcess?.id === processId) {
          setSelectedProcess({ ...selectedProcess, ...data.process });
        }
        toast.success("تم تحديث المهمة");
      } else {
        toast.error("حدث خطأ في تحديث المهمة");
      }
    } catch (error) {
      toast.error("حدث خطأ في الاتصال");
    }
  };

  // Update status
  const handleStatusChange = async (processId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/onboarding/${processId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success("تم تحديث الحالة");
        fetchData();
      } else {
        toast.error("حدث خطأ في تحديث الحالة");
      }
    } catch (error) {
      toast.error("حدث خطأ في الاتصال");
    }
  };

  // Delete process
  const handleDeleteProcess = async () => {
    if (!deleteProcessId) return;

    try {
      const res = await fetch(`/api/onboarding/${deleteProcessId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("تم حذف عملية الإلحاق");
        setDeleteProcessId(null);
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || "حدث خطأ في الحذف");
      }
    } catch (error) {
      toast.error("حدث خطأ في الاتصال");
    }
  };

  // Create template
  const handleCreateTemplate = async () => {
    if (!newTemplate.name) {
      toast.error("يرجى إدخال اسم القالب");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTemplate),
      });

      if (res.ok) {
        toast.success("تم إنشاء القالب بنجاح");
        setIsTemplateDialogOpen(false);
        setNewTemplate({
          name: "",
          description: "",
          durationDays: 30,
          tasks: [],
          documents: [],
          isActive: true,
        });
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || "حدث خطأ في إنشاء القالب");
      }
    } catch (error) {
      toast.error("حدث خطأ في الاتصال");
    } finally {
      setSubmitting(false);
    }
  };

  const getEmployeeName = (employee: OnboardingProcess["employee"]) => {
    return `${employee.firstNameAr || employee.firstName} ${employee.lastNameAr || employee.lastName}`;
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <IconLoader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري تحميل بيانات الإلحاق...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* بطاقات الإحصائيات */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العمليات</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">في عملية الإلحاق</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">قيد التنفيذ</CardTitle>
            <IconProgress className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">يمرون بالإجراءات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مكتملة</CardTitle>
            <IconCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">أتموا الإلحاق</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">لم تبدأ</CardTitle>
            <IconAlertCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.notStarted}</div>
            <p className="text-xs text-muted-foreground">بانتظار البدء</p>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="processes">
            <IconClipboardList className="h-4 w-4 ms-2" />
            عمليات الإلحاق
          </TabsTrigger>
          <TabsTrigger value="templates">
            <IconTemplate className="h-4 w-4 ms-2" />
            القوالب
          </TabsTrigger>
        </TabsList>

        <TabsContent value="processes" className="mt-4">
          {/* جدول الإلحاق */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>عمليات الإلحاق</CardTitle>
                  <CardDescription>متابعة إجراءات الموظفين الجدد</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={fetchData}>
                    <IconRefresh className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <IconPlus className="ms-2 h-4 w-4" />
                    بدء إلحاق جديد
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* أدوات البحث والفلترة */}
              <div className="flex flex-col gap-4 mb-6 sm:flex-row">
                <div className="relative flex-1">
                  <IconSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="بحث عن موظف..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <IconFilter className="ms-2 h-4 w-4" />
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* جدول العمليات */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الموظف</TableHead>
                      <TableHead>الوظيفة</TableHead>
                      <TableHead>القسم</TableHead>
                      <TableHead>تاريخ البدء</TableHead>
                      <TableHead>التقدم</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-start">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProcesses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <p className="text-muted-foreground">لا توجد عمليات إلحاق</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProcesses.map((process) => (
                        <TableRow key={process.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={process.employee.avatar} alt="" />
                                <AvatarFallback>
                                  {getInitials(getEmployeeName(process.employee))}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{getEmployeeName(process.employee)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {process.employee.jobTitle?.nameAr || process.employee.jobTitle?.name || "-"}
                          </TableCell>
                          <TableCell>
                            {process.employee.department?.nameAr || process.employee.department?.name || "-"}
                          </TableCell>
                          <TableCell>
                            {new Date(process.startDate).toLocaleDateString("ar-SA")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 w-32">
                              <Progress value={process.progress} className="h-2" />
                              <span className="text-xs text-muted-foreground w-8">
                                {process.progress}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[process.status]}>
                              {statusLabels[process.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedProcess(process);
                                  setIsViewSheetOpen(true);
                                }}
                              >
                                <IconClipboardList className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteProcessId(process.id)}
                              >
                                <IconTrash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>قوالب الإلحاق</CardTitle>
                  <CardDescription>إدارة قوالب عملية الإلحاق</CardDescription>
                </div>
                <Button onClick={() => setIsTemplateDialogOpen(true)}>
                  <IconPlus className="ms-2 h-4 w-4" />
                  قالب جديد
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <IconTemplate className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">لا توجد قوالب</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => setIsTemplateDialogOpen(true)}
                  >
                    إنشاء قالب جديد
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {templates.map((template) => (
                    <Card key={template.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "نشط" : "غير نشط"}
                          </Badge>
                        </div>
                        {template.description && (
                          <CardDescription className="line-clamp-2">
                            {template.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{template.durationDays} يوم</span>
                          <span>{template._count?.processes || 0} استخدام</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <span className="text-xs text-muted-foreground">
                            {template.tasks?.length || 0} مهمة
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {template.documents?.length || 0} مستند
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog بدء إلحاق جديد */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-full sm:max-w-md">
          <DialogHeader>
            <DialogTitle>بدء عملية إلحاق جديدة</DialogTitle>
            <DialogDescription>اختر الموظف الجديد وقالب الإلحاق</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>الموظف الجديد *</Label>
              <Select
                value={newProcess.employeeId}
                onValueChange={(value) => setNewProcess({ ...newProcess, employeeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstNameAr || emp.firstName} {emp.lastNameAr || emp.lastName}
                      {emp.jobTitle && ` - ${emp.jobTitle.nameAr || emp.jobTitle.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>قالب الإلحاق</Label>
              <Select
                value={newProcess.templateId}
                onValueChange={(value) => setNewProcess({ ...newProcess, templateId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر القالب (اختياري)" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.durationDays} يوم)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>تاريخ البدء</Label>
              <Input
                type="date"
                value={newProcess.startDate}
                onChange={(e) => setNewProcess({ ...newProcess, startDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={newProcess.notes}
                onChange={(e) => setNewProcess({ ...newProcess, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreateProcess} disabled={submitting}>
              {submitting ? (
                <>
                  <IconLoader className="h-4 w-4 animate-spin ms-2" />
                  جاري الإنشاء...
                </>
              ) : (
                "بدء الإلحاق"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog إنشاء قالب */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="w-full sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إنشاء قالب إلحاق جديد</DialogTitle>
            <DialogDescription>أنشئ قالب يمكن استخدامه لعمليات الإلحاق</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>اسم القالب *</Label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="مثال: قالب تقنية المعلومات"
              />
            </div>
            <div className="grid gap-2">
              <Label>الوصف</Label>
              <Textarea
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="وصف القالب..."
              />
            </div>
            <div className="grid gap-2">
              <Label>مدة الإلحاق (بالأيام)</Label>
              <Input
                type="number"
                value={newTemplate.durationDays}
                onChange={(e) => setNewTemplate({ ...newTemplate, durationDays: parseInt(e.target.value) || 30 })}
                min={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreateTemplate} disabled={submitting}>
              {submitting ? (
                <>
                  <IconLoader className="h-4 w-4 animate-spin ms-2" />
                  جاري الإنشاء...
                </>
              ) : (
                "إنشاء القالب"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sheet عرض المهام */}
      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>مهام الإلحاق</SheetTitle>
            <SheetDescription>
              متابعة مهام {selectedProcess ? getEmployeeName(selectedProcess.employee) : ""}
            </SheetDescription>
          </SheetHeader>
          {selectedProcess && (
            <div className="space-y-6 py-4">
              {/* معلومات الموظف */}
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedProcess.employee.avatar} alt="" />
                  <AvatarFallback>
                    {getInitials(getEmployeeName(selectedProcess.employee))}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{getEmployeeName(selectedProcess.employee)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedProcess.employee.jobTitle?.nameAr || selectedProcess.employee.jobTitle?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedProcess.employee.department?.nameAr || selectedProcess.employee.department?.name}
                  </p>
                </div>
              </div>

              {/* التقدم */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>التقدم الكلي</span>
                  <span>{selectedProcess.progress}%</span>
                </div>
                <Progress value={selectedProcess.progress} className="h-3" />
              </div>

              {/* تغيير الحالة */}
              <div className="grid gap-2">
                <Label>الحالة</Label>
                <Select
                  value={selectedProcess.status}
                  onValueChange={(value) => handleStatusChange(selectedProcess.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* المدير */}
              {selectedProcess.employee.manager && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">المدير المباشر</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {getInitials(
                          `${selectedProcess.employee.manager.firstNameAr || selectedProcess.employee.manager.firstName} ${selectedProcess.employee.manager.lastNameAr || selectedProcess.employee.manager.lastName}`
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm">
                        {selectedProcess.employee.manager.firstNameAr || selectedProcess.employee.manager.firstName}{" "}
                        {selectedProcess.employee.manager.lastNameAr || selectedProcess.employee.manager.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{selectedProcess.employee.manager.email}</p>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* قائمة المهام */}
              <div>
                <h4 className="font-semibold mb-3">قائمة المهام</h4>
                {selectedProcess.tasks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">لا توجد مهام</p>
                ) : (
                  <div className="space-y-3">
                    {selectedProcess.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-3 rounded-lg border"
                      >
                        <Checkbox
                          checked={task.isCompleted}
                          onCheckedChange={(checked) =>
                            handleTaskStatusChange(selectedProcess.id, task.id, checked as boolean)
                          }
                        />
                        <div className="flex-1">
                          <p className={`font-medium ${task.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                          <div className="flex gap-2 mt-1">
                            {task.category && (
                              <Badge variant="outline" className="text-xs">
                                {taskCategoryLabels[task.category] || task.category}
                              </Badge>
                            )}
                            <Badge className={`text-xs ${task.isCompleted ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                              {task.isCompleted ? "مكتملة" : "قيد الانتظار"}
                            </Badge>
                          </div>
                          {task.dueDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              الموعد: {new Date(task.dueDate).toLocaleDateString("ar-SA")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* المستندات */}
              {selectedProcess.documents.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-3">المستندات المطلوبة</h4>
                    <div className="space-y-2">
                      {selectedProcess.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-2">
                            <IconFileText className="h-4 w-4 text-muted-foreground" />
                            <span>{doc.name}</span>
                            {doc.isRequired && (
                              <Badge variant="destructive" className="text-xs">
                                مطلوب
                              </Badge>
                            )}
                          </div>
                          <Badge className={doc.isSubmitted ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                            {doc.isSubmitted ? "مرفق" : "بانتظار"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Alert Dialog للحذف */}
      <AlertDialog open={!!deleteProcessId} onOpenChange={() => setDeleteProcessId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف عملية الإلحاق بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProcess} className="bg-destructive hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
