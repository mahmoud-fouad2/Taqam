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
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

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
  NOT_STARTED: t.common.notStarted,
  IN_PROGRESS: t.common.inProgress,
  COMPLETED: t.common.completed,
  CANCELLED: t.common.cancelled,
};

const statusColors: Record<string, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const taskCategoryLabels: Record<string, string> = {
  documentation: t.onboarding.documentation,
  "system-access": t.onboarding.systemAccess,
  training: t.onboarding.training,
  introduction: t.onboarding.introduction,
  equipment: t.onboarding.equipment,
  other: t.common.other,
};

export function OnboardingManagerNew() {
  const locale = useClientLocale();
  const t = getText(locale);
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
      toast.error(t.onboarding.fetchError);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t.onboarding.fetchError]);

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
      toast.error(t.onboarding.selectEmployee);
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
        toast.success(t.onboarding.onboardingStarted);
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
        toast.error(error.error || t.onboarding.startFailed);
      }
    } catch (error) {
      toast.error(t.onboarding.connectionError);
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
        toast.success(t.onboarding.taskUpdated);
      } else {
        toast.error(t.onboarding.taskUpdateError);
      }
    } catch (error) {
      toast.error(t.onboarding.connectionError);
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
        toast.success(t.onboarding.statusUpdated);
        fetchData();
      } else {
        toast.error(t.performanceGoals.statusUpdateFailed);
      }
    } catch (error) {
      toast.error(t.onboarding.connectionError);
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
        toast.success(t.onboarding.onboardingDeleted);
        setDeleteProcessId(null);
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || t.onboarding.deleteFailed);
      }
    } catch (error) {
      toast.error(t.onboarding.connectionError);
    }
  };

  // Create template
  const handleCreateTemplate = async () => {
    if (!newTemplate.name) {
      toast.error(t.onboarding.enterTemplateName);
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
        toast.success(t.onboarding.templateCreated);
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
        toast.error(error.error || t.onboarding.createTemplateFailed);
      }
    } catch (error) {
      toast.error(t.onboarding.connectionError);
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
          <p className="text-muted-foreground">{t.onboarding.loadingData}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* {t.onboarding.statsCards} */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.onboarding.totalProcesses}</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{t.onboarding.inProcess}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.common.inProgress}</CardTitle>
            <IconProgress className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">{t.onboarding.undergoing}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.common.completed}</CardTitle>
            <IconCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">{t.onboarding.completedOnboarding}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.onboarding.notStartedYet}</CardTitle>
            <IconAlertCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.notStarted}</div>
            <p className="text-xs text-muted-foreground">{t.onboarding.awaitingStart}</p>
          </CardContent>
        </Card>
      </div>

      {/* {t.onboarding.tabs} */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="processes">
            <IconClipboardList className="h-4 w-4 ms-2" />
            {t.onboarding.operations}
          </TabsTrigger>
          <TabsTrigger value="templates">
            <IconTemplate className="h-4 w-4 ms-2" />
            {t.onboarding.templates}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="processes" className="mt-4">
          {/* {t.onboarding.operationsTable} */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>{t.onboarding.processesTab}</CardTitle>
                  <CardDescription>{t.onboarding.pageSubtitle}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={fetchData}>
                    <IconRefresh className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <IconPlus className="ms-2 h-4 w-4" />
                    {t.onboarding.startNew}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* {t.onboarding.searchFilter} */}
              <div className="flex flex-col gap-4 mb-6 sm:flex-row">
                <div className="relative flex-1">
                  <IconSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t.onboarding.searchEmployee}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <IconFilter className="ms-2 h-4 w-4" />
                    <SelectValue placeholder={t.common.status} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.common.allStatuses}</SelectItem>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* {t.onboarding.operationsTable} */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.common.employee}</TableHead>
                      <TableHead>{t.onboarding.jobCol}</TableHead>
                      <TableHead>{t.common.department}</TableHead>
                      <TableHead>{t.common.startDate}</TableHead>
                      <TableHead>{t.common.inProgress}</TableHead>
                      <TableHead>{t.common.status}</TableHead>
                      <TableHead className="text-start">{t.common.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProcesses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <p className="text-muted-foreground">{t.onboarding.noProcesses}</p>
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
                  <CardTitle>{t.onboarding.templatesTitle}</CardTitle>
                  <CardDescription>{t.onboarding.templatesSubtitle}</CardDescription>
                </div>
                <Button onClick={() => setIsTemplateDialogOpen(true)}>
                  <IconPlus className="ms-2 h-4 w-4" />
                  {t.onboarding.newTemplate}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <IconTemplate className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">{t.onboarding.noTemplates}</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => setIsTemplateDialogOpen(true)}
                  >
                    {t.onboarding.pCreate} {t.onboarding.newTemplate}
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
                            {template.isActive ? t.common.active : t.common.inactive}
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
                          <span>{template.durationDays} {t.onboarding.dayUnit}</span>
                          <span>{template._count?.processes || 0} {t.onboarding.usageCount}</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <span className="text-xs text-muted-foreground">
                            {template.tasks?.length || 0} {t.onboarding.taskCount}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {template.documents?.length || 0} {t.onboarding.docCount}
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

      {/* Dialog {t.onboarding.startNew} */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-full sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.onboarding.startDialog}</DialogTitle>
            <DialogDescription>{t.onboarding.startDialogDesc}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t.onboarding.newEmployee}</Label>
              <Select
                value={newProcess.employeeId}
                onValueChange={(value) => setNewProcess({ ...newProcess, employeeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.common.selectEmployee} />
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
              <Label>{t.onboarding.templateSelect}</Label>
              <Select
                value={newProcess.templateId}
                onValueChange={(value) => setNewProcess({ ...newProcess, templateId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.onboarding.chooseTemplate} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.durationDays} {t.onboarding.dayUnit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t.common.startDate}</Label>
              <Input
                type="date"
                value={newProcess.startDate}
                onChange={(e) => setNewProcess({ ...newProcess, startDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t.common.notes}</Label>
              <Textarea
                value={newProcess.notes}
                onChange={(e) => setNewProcess({ ...newProcess, notes: e.target.value })}
                placeholder={t.common.additionalNotes}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>{t.common.cancel}</Button>
            <Button onClick={handleCreateProcess} disabled={submitting}>
              {submitting ? (
                <>
                  <IconLoader className="h-4 w-4 animate-spin ms-2" />{t.common.creating}</>
              ) : (
                t.onboarding.startOnboarding
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* {t.onboarding.createTemplateDialog} */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="w-full sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.onboarding.createTemplateDialog}</DialogTitle>
            <DialogDescription>{t.onboarding.createTemplateDialogDesc}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t.onboarding.templateNameLabel}</Label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder={t.onboarding.templateNameExample}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t.common.description}</Label>
              <Textarea
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder={t.onboarding.templateDescPlaceholder}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t.onboarding.durationDays}</Label>
              <Input
                type="number"
                value={newTemplate.durationDays}
                onChange={(e) => setNewTemplate({ ...newTemplate, durationDays: parseInt(e.target.value) || 30 })}
                min={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>{t.common.cancel}</Button>
            <Button onClick={handleCreateTemplate} disabled={submitting}>
              {submitting ? (
                <>
                  <IconLoader className="h-4 w-4 animate-spin ms-2" />{t.common.creating}</>
              ) : (
                t.onboarding.createTemplate
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* {t.onboarding.taskSheet} */}
      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t.onboarding.tasks}</SheetTitle>
            <SheetDescription>
              {t.onboarding.taskSheet} {selectedProcess ? getEmployeeName(selectedProcess.employee) : ""}
            </SheetDescription>
          </SheetHeader>
          {selectedProcess && (
            <div className="space-y-6 py-4">
              {/* {t.onboarding.employeeInfo} */}
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

              {/* {t.onboarding.progress} */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{t.onboarding.totalProgress}</span>
                  <span>{selectedProcess.progress}%</span>
                </div>
                <Progress value={selectedProcess.progress} className="h-3" />
              </div>

              {/* {t.onboarding.changeStatus} */}
              <div className="grid gap-2">
                <Label>{t.common.status}</Label>
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

              {/* {t.onboarding.manager} */}
              {selectedProcess.employee.manager && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">{t.onboarding.directManager}</p>
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

              {/* {t.onboarding.taskList} */}
              <div>
                <h4 className="font-semibold mb-3">{t.onboarding.taskList}</h4>
                {selectedProcess.tasks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">{t.onboarding.noTasks}</p>
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
                              {task.isCompleted ? t.common.completed : t.common.pending}
                            </Badge>
                          </div>
                          {task.dueDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {t.onboarding.dueDate} {new Date(task.dueDate).toLocaleDateString("ar-SA")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* {t.onboarding.docsSection} */}
              {selectedProcess.documents.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-3">{t.onboarding.requiredDocuments}</h4>
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
                                {t.onboarding.required}
                              </Badge>
                            )}
                          </div>
                          <Badge className={doc.isSubmitted ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                            {doc.isSubmitted ? t.onboarding.attached : t.onboarding.awaitingAttach}
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

      {/* Delete Alert */}
      <AlertDialog open={!!deleteProcessId} onOpenChange={() => setDeleteProcessId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.common.confirmDeleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.onboarding.deleteConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProcess} className="bg-destructive hover:bg-destructive/90">{t.common.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
