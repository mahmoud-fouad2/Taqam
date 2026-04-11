"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconTarget,
  IconCheck,
  IconX,
  IconDots,
  IconProgress,
  IconFlag,
  IconRefresh
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

// Types
interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  firstNameAr?: string | null;
  lastNameAr?: string | null;
  employeeNumber: string;
  avatar?: string | null;
  department?: { name: string; nameAr?: string | null } | null;
  jobTitle?: { name: string; nameAr?: string | null } | null;
}

interface PerformanceGoal {
  id: string;
  title: string;
  titleAr?: string | null;
  description: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "DRAFT" | "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  targetValue?: string | null;
  currentValue?: string | null;
  unit?: string | null;
  startDate: string;
  dueDate: string;
  completedAt?: string | null;
  progress: number;
  notes?: string | null;
  employee: Employee;
  manager?: Employee | null;
  createdAt: string;
}

// Labels
const statusLabels: Record<string, string> = {
  DRAFT: t.common.draft,
  PENDING: t.common.pending,
  IN_PROGRESS: t.common.inProgress,
  COMPLETED: t.common.completed,
  CANCELLED: t.performanceGoals.cancelled
};

const priorityLabels: Record<string, string> = {
  LOW: t.common.low,
  MEDIUM: t.common.medium,
  HIGH: t.common.high,
  CRITICAL: t.common.critical
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800"
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700"
};

export function PerformanceGoalsManagerNew() {
  const locale = useClientLocale();
  const t = getText(locale);
  // State
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<PerformanceGoal | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [stats, setStats] = useState({
    draft: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0
  });

  type GoalPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  type GoalFormData = {
    employeeId: string;
    title: string;
    titleAr: string;
    description: string;
    category: string;
    priority: GoalPriority;
    targetValue: string;
    unit: string;
    startDate: string;
    dueDate: string;
    managerId: string;
    notes: string;
  };

  // Form state
  const [formData, setFormData] = useState<GoalFormData>({
    employeeId: "",
    title: "",
    titleAr: "",
    description: "",
    category: "performance",
    priority: "MEDIUM",
    targetValue: "",
    unit: "%",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    managerId: "",
    notes: ""
  });

  // Fetch goals
  const fetchGoals = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterPriority !== "all") params.append("priority", filterPriority);

      const res = await fetch(`/api/performance-goals?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      setGoals(data.goals || []);
      if (data.stats) setStats(data.stats);
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast.error(t.performanceGoals.fetchFailed);
    }
  }, [filterStatus, filterPriority, t.performanceGoals.fetchFailed]);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees?status=ACTIVE&limit=100");
      if (!res.ok) throw new Error("Failed to fetch employees");
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchGoals(), fetchEmployees()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchGoals, fetchEmployees]);

  // Reset form
  const resetForm = () => {
    setFormData({
      employeeId: "",
      title: "",
      titleAr: "",
      description: "",
      category: "performance",
      priority: "MEDIUM",
      targetValue: "",
      unit: "%",
      startDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      managerId: "",
      notes: ""
    });
  };

  // Handle add
  const handleAdd = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  // Handle edit
  const handleEdit = (goal: PerformanceGoal) => {
    setSelectedGoal(goal);
    setFormData({
      employeeId: goal.employee.id,
      title: goal.title,
      titleAr: goal.titleAr || "",
      description: goal.description,
      category: goal.category,
      priority: goal.priority,
      targetValue: goal.targetValue || "",
      unit: goal.unit || "%",
      startDate: goal.startDate.split("T")[0],
      dueDate: goal.dueDate.split("T")[0],
      managerId: goal.manager?.id || "",
      notes: goal.notes || ""
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete
  const handleDelete = (goal: PerformanceGoal) => {
    setSelectedGoal(goal);
    setIsDeleteDialogOpen(true);
  };

  // Submit form
  const handleSubmit = async (isEdit: boolean) => {
    if (!formData.employeeId || !formData.title || !formData.description || !formData.dueDate) {
      toast.error(t.common.fillRequired);
      return;
    }

    setIsSaving(true);
    try {
      const url = isEdit ? `/api/performance-goals/${selectedGoal?.id}` : "/api/performance-goals";

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          managerId: formData.managerId || null
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || t.organization.genericError);
      }

      await fetchGoals();
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      resetForm();
      toast.success(isEdit ? t.performanceGoals.updatedSuccess : t.performanceGoals.addedSuccess);
    } catch (error) {
      console.error("Error saving goal:", error);
      toast.error(error instanceof Error ? error.message : t.organization.genericError);
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!selectedGoal) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/performance-goals/${selectedGoal.id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || t.organization.genericError);
      }

      await fetchGoals();
      setIsDeleteDialogOpen(false);
      setSelectedGoal(null);
      toast.success(t.performanceGoals.deletedSuccess);
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error(error instanceof Error ? error.message : t.onboarding.deleteFailed);
    } finally {
      setIsSaving(false);
    }
  };

  // Update status
  const handleStatusChange = async (goalId: string, status: string) => {
    try {
      const res = await fetch(`/api/performance-goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (!res.ok) throw new Error("Failed to update status");

      await fetchGoals();
      toast.success(t.performanceGoals.statusUpdatedSuccess);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(t.performanceGoals.statusUpdateFailed);
    }
  };

  // Update progress
  const handleProgressChange = async (goalId: string, progress: number) => {
    try {
      const res = await fetch(`/api/performance-goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress })
      });

      if (!res.ok) throw new Error("Failed to update progress");

      await fetchGoals();
      toast.success(t.performanceGoals.progressUpdatedSuccess);
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error(t.performanceGoals.progressUpdateFailed);
    }
  };

  // Get employee name
  const getEmployeeName = (emp: Employee) => {
    return emp.firstNameAr && emp.lastNameAr
      ? `${emp.firstNameAr} ${emp.lastNameAr}`
      : `${emp.firstName} ${emp.lastName}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.performanceGoals.title}</h1>
          <p className="text-muted-foreground">{t.performanceGoals.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label={t.common.refresh}
            onClick={() => fetchGoals()}>
            <IconRefresh className="size-4" />
          </Button>
          <Button onClick={handleAdd}>
            <IconPlus className="ms-2 size-4" />
            {t.performanceGoals.addGoal}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.common.draft}</CardDescription>
            <CardTitle className="text-3xl">{stats.draft}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.common.pending}</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.common.inProgress}</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.inProgress}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.common.completed}</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.completed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.common.cancelled}</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.cancelled}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <IconTarget className="size-5" />
              {t.performanceGoals.pGoalsList}
            </CardTitle>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t.common.status} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.common.allStatuses}</SelectItem>
                  <SelectItem value="DRAFT">{t.common.draft}</SelectItem>
                  <SelectItem value="PENDING">{t.common.pending}</SelectItem>
                  <SelectItem value="IN_PROGRESS">{t.common.inProgress}</SelectItem>
                  <SelectItem value="COMPLETED">{t.common.completed}</SelectItem>
                  <SelectItem value="CANCELLED">{t.common.cancelled}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t.common.priority} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.performanceGoals.allPriorities}</SelectItem>
                  <SelectItem value="LOW">{t.common.low}</SelectItem>
                  <SelectItem value="MEDIUM">{t.common.medium}</SelectItem>
                  <SelectItem value="HIGH">{t.common.high}</SelectItem>
                  <SelectItem value="CRITICAL">{t.common.critical}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="py-12 text-center">
              <IconTarget className="text-muted-foreground/50 mx-auto mb-4 size-12" />
              <p className="text-muted-foreground">{t.developmentPlans.noGoals}</p>
              <Button variant="outline" className="mt-4" onClick={handleAdd}>
                {t.performanceGoals.pAddNewGoal}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.common.employee}</TableHead>
                  <TableHead>{t.performanceGoals.goal}</TableHead>
                  <TableHead>{t.common.inProgress}</TableHead>
                  <TableHead>{t.common.priority}</TableHead>
                  <TableHead>{t.common.status}</TableHead>
                  <TableHead>{t.performanceGoals.dueDate}</TableHead>
                  <TableHead className="text-start">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals.map((goal) => (
                  <TableRow key={goal.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-8">
                          <AvatarImage src={goal.employee.avatar || ""} alt="" />
                          <AvatarFallback>
                            {goal.employee.firstName[0]}
                            {goal.employee.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{getEmployeeName(goal.employee)}</p>
                          <p className="text-muted-foreground text-xs">
                            {goal.employee.department?.nameAr ||
                              goal.employee.department?.name ||
                              "-"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{goal.titleAr || goal.title}</p>
                        <p className="text-muted-foreground line-clamp-1 text-xs">
                          {goal.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <div className="mb-1 flex items-center gap-2">
                          <Progress value={goal.progress} className="h-2 flex-1" />
                          <span className="text-xs font-medium">{goal.progress}%</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityColors[goal.priority]}>
                        {priorityLabels[goal.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[goal.status]}>
                        {statusLabels[goal.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {format(new Date(goal.dueDate), "dd MMM yyyy", { locale: ar })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={t.common.options}>
                            <IconDots className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(goal)}>
                            <IconEdit className="ms-2 size-4" />
                            {t.common.edit}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(goal.id, "IN_PROGRESS")}
                            disabled={goal.status === "IN_PROGRESS"}>
                            <IconProgress className="ms-2 size-4" />
                            {t.common.startExecution}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(goal.id, "COMPLETED")}
                            disabled={goal.status === "COMPLETED"}>
                            <IconCheck className="ms-2 size-4" />
                            {t.performanceGoals.pComplete}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(goal.id, "CANCELLED")}
                            disabled={goal.status === "CANCELLED" || goal.status === "COMPLETED"}>
                            <IconX className="ms-2 size-4" />
                            {t.common.cancel}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(goal)}
                            className="text-destructive"
                            disabled={goal.status === "COMPLETED"}>
                            <IconTrash className="ms-2 size-4" />
                            {t.common.delete}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }
        }}>
        <DialogContent className="w-full sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? t.performanceGoals.editGoal : t.performanceGoals.addNewGoal}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen ? t.performanceGoals.editGoalData : t.performanceGoals.addGoalDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[60vh] gap-4 overflow-y-auto py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t.common.selectEmployee}</Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                  disabled={isEditDialogOpen}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.common.selectEmployee} />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {getEmployeeName(emp)} - {emp.employeeNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.performanceGoals.responsibleManager}</Label>
                <Select
                  value={formData.managerId}
                  onValueChange={(value) => setFormData({ ...formData, managerId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.performanceGoals.chooseManager} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t.performanceGoals.none}</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {getEmployeeName(emp)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t.performanceGoals.goalTitleEn}</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Goal title"
                />
              </div>
              <div className="space-y-2">
                <Label>{t.performanceGoals.goalTitleAr}</Label>
                <Input
                  value={formData.titleAr}
                  onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                  placeholder={t.performanceGoals.goalTitlePlaceholder}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.performanceGoals.goalDesc}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t.performanceGoals.detailedDesc}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="space-y-2">
                <Label>{t.performanceGoals.category}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">{t.performanceGoals.performance}</SelectItem>
                    <SelectItem value="development">{t.performanceGoals.development}</SelectItem>
                    <SelectItem value="learning">{t.performanceGoals.learning}</SelectItem>
                    <SelectItem value="project">{t.performanceGoals.projects}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.common.priority}</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">{t.common.low}</SelectItem>
                    <SelectItem value="MEDIUM">{t.common.medium}</SelectItem>
                    <SelectItem value="HIGH">{t.common.high}</SelectItem>
                    <SelectItem value="CRITICAL">{t.common.critical}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.performanceGoals.unit}</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="%">{t.performanceGoals.percentUnit}</SelectItem>
                    <SelectItem value={t.performanceGoals.number}>
                      {t.performanceGoals.countUnit}
                    </SelectItem>
                    <SelectItem value={t.performanceGoals.riyal}>
                      {t.performanceGoals.pSar}
                    </SelectItem>
                    <SelectItem value={t.common.hour}>{t.common.hour}</SelectItem>
                    <SelectItem value={t.performanceGoals.project}>
                      {t.performanceGoals.pProject}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t.performanceGoals.targetValue}</Label>
                <Input
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label>{t.performanceGoals.dueDateRequired}</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t.common.startDate}</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.common.notes}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t.common.additionalNotes}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                resetForm();
              }}>
              {t.common.cancel}
            </Button>
            <Button onClick={() => handleSubmit(isEditDialogOpen)} disabled={isSaving}>
              {isSaving ? t.common.saving : isEditDialogOpen ? t.common.update : t.common.add}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.performanceGoals.deleteGoal}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.performanceGoals.pAreYouSureYouWantToDeleteTheGo} &quot;
              {selectedGoal?.titleAr || selectedGoal?.title}&quot;?
              <br />
              {t.common.cannotUndo}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSaving ? t.common.deleting : t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
