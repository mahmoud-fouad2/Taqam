"use client";

import * as React from "react";
import {
  IconPlus,
  IconSearch,
  IconEye,
  IconEdit,
  IconTrash,
  IconX,
  IconTarget,
  IconProgress,
  IconCheck,
  IconCalendar,
  IconPlayerPlay,
  IconClock
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useEmployees } from "@/hooks/use-employees";
import { developmentPlansApi, type DevelopmentPlanUpsertInput } from "@/lib/api/training";
import {
  type DevelopmentPlan,
  type DevelopmentGoal,
  type DevelopmentActivity,
  type DevelopmentPlanStatus,
  type DevelopmentPlanType,
  type DevelopmentPlanPriority,
  developmentPlanStatusLabels,
  developmentPlanStatusColors,
  developmentPlanTypeLabels,
  developmentPlanPriorityLabels,
  developmentPlanPriorityColors,
  activityTypeLabels
} from "@/lib/types/training";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

type EditablePlanGoal = {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  status: DevelopmentGoal["status"];
  progress: number;
  metrics: string;
  completedDate: string;
};

type EditablePlanActivity = {
  id: string;
  title: string;
  description: string;
  type: DevelopmentActivity["type"];
  courseId: string;
  dueDate: string;
  status: DevelopmentActivity["status"];
  completedDate: string;
  notes: string;
};

type PlanFormState = {
  employeeId: string;
  title: string;
  description: string;
  startDate: string;
  targetDate: string;
  mentorId: string;
  type: DevelopmentPlanType;
  priority: DevelopmentPlanPriority;
  status: DevelopmentPlanStatus;
  goals: EditablePlanGoal[];
  activities: EditablePlanActivity[];
  notes: string;
};

const EMPTY_FORM: PlanFormState = {
  employeeId: "",
  title: "",
  description: "",
  startDate: "",
  targetDate: "",
  mentorId: "",
  type: "individual",
  priority: "medium",
  status: "draft",
  goals: [],
  activities: [],
  notes: ""
};

function createEditorId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyGoal(targetDate = ""): EditablePlanGoal {
  return {
    id: createEditorId("goal"),
    title: "",
    description: "",
    targetDate,
    status: "not-started",
    progress: 0,
    metrics: "",
    completedDate: ""
  };
}

function createEmptyActivity(dueDate = ""): EditablePlanActivity {
  return {
    id: createEditorId("activity"),
    title: "",
    description: "",
    type: "other",
    courseId: "",
    dueDate,
    status: "pending",
    completedDate: "",
    notes: ""
  };
}

function toDateInputValue(value: string) {
  return value ? value.slice(0, 10) : "";
}

function clampProgressValue(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeEditableGoal(goal: EditablePlanGoal): EditablePlanGoal {
  const progress = clampProgressValue(goal.progress);

  if (goal.status === "completed" || progress >= 100) {
    return {
      ...goal,
      status: "completed",
      progress: 100,
      completedDate: goal.completedDate || goal.targetDate
    };
  }

  if (goal.status === "not-started" || progress <= 0) {
    return {
      ...goal,
      status: "not-started",
      progress: 0,
      completedDate: ""
    };
  }

  return {
    ...goal,
    status: "in-progress",
    progress: progress || 50,
    completedDate: ""
  };
}

function normalizeEditableActivity(activity: EditablePlanActivity): EditablePlanActivity {
  if (activity.status === "completed") {
    return {
      ...activity,
      completedDate: activity.completedDate || activity.dueDate
    };
  }

  return {
    ...activity,
    completedDate: ""
  };
}

function getGoalStatusLabel(status: DevelopmentGoal["status"]) {
  switch (status) {
    case "completed":
      return t.common.completed;
    case "in-progress":
      return t.common.inProgress;
    default:
      return t.common.notStarted;
  }
}

function getActivityStatusLabel(status: DevelopmentActivity["status"]) {
  switch (status) {
    case "completed":
      return t.common.completed;
    case "in-progress":
      return t.common.inProgress;
    case "skipped":
      return t.common.skipped;
    default:
      return t.common.pending;
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ar-SA");
}

function buildFormState(plan: DevelopmentPlan): PlanFormState {
  return {
    employeeId: plan.employeeId,
    title: plan.title,
    description: plan.description || "",
    startDate: toDateInputValue(plan.startDate),
    targetDate: toDateInputValue(plan.targetDate),
    mentorId: plan.mentor?.id || "",
    type: plan.type,
    priority: plan.priority,
    status: plan.status,
    goals: plan.goals.map((goal) =>
      normalizeEditableGoal({
        id: goal.id,
        title: goal.title,
        description: goal.description || "",
        targetDate: toDateInputValue(goal.targetDate) || toDateInputValue(plan.targetDate),
        status: goal.status,
        progress: goal.progress,
        metrics: goal.metrics || "",
        completedDate: toDateInputValue(goal.completedDate || "")
      })
    ),
    activities: plan.activities.map((activity) =>
      normalizeEditableActivity({
        id: activity.id,
        title: activity.title,
        description: activity.description || "",
        type: activity.type,
        courseId: activity.courseId || "",
        dueDate: toDateInputValue(activity.dueDate) || toDateInputValue(plan.targetDate),
        status: activity.status,
        completedDate: toDateInputValue(activity.completedDate || ""),
        notes: activity.notes || ""
      })
    ),
    notes: plan.notes || ""
  };
}

function buildPayload(form: PlanFormState): DevelopmentPlanUpsertInput {
  const fallbackTargetDate = form.targetDate || form.startDate;

  const goals = form.goals
    .filter((goal) => goal.title.trim().length > 0)
    .map((goal) => {
      const normalizedGoal = normalizeEditableGoal({
        ...goal,
        targetDate: goal.targetDate || fallbackTargetDate
      });

      return {
        id: normalizedGoal.id,
        title: normalizedGoal.title.trim(),
        description: normalizedGoal.description.trim() || undefined,
        targetDate: normalizedGoal.targetDate || fallbackTargetDate,
        status: normalizedGoal.status,
        progress: normalizedGoal.progress,
        metrics: normalizedGoal.metrics.trim() || undefined,
        completedDate:
          normalizedGoal.status === "completed"
            ? normalizedGoal.completedDate || normalizedGoal.targetDate || fallbackTargetDate
            : undefined
      };
    });

  const activities = form.activities
    .filter((activity) => activity.title.trim().length > 0)
    .map((activity) => {
      const normalizedActivity = normalizeEditableActivity({
        ...activity,
        dueDate: activity.dueDate || fallbackTargetDate
      });

      return {
        id: normalizedActivity.id,
        title: normalizedActivity.title.trim(),
        type: normalizedActivity.type,
        description: normalizedActivity.description.trim() || undefined,
        courseId: normalizedActivity.courseId.trim() || undefined,
        dueDate: normalizedActivity.dueDate || fallbackTargetDate,
        status: normalizedActivity.status,
        completedDate:
          normalizedActivity.status === "completed"
            ? normalizedActivity.completedDate || normalizedActivity.dueDate || fallbackTargetDate
            : undefined,
        notes: normalizedActivity.notes.trim() || undefined
      };
    });

  return {
    employeeId: form.employeeId,
    title: form.title,
    description: form.description || undefined,
    startDate: form.startDate,
    targetDate: form.targetDate,
    mentorId: form.mentorId || undefined,
    type: form.type,
    priority: form.priority,
    status: form.status,
    goals,
    activities,
    notes: form.notes || undefined
  };
}

function getActivityStatusColor(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "in-progress":
      return "bg-blue-100 text-blue-800";
    case "pending":
      return "bg-gray-100 text-gray-800";
    case "skipped":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getGoalStatusColor(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "in-progress":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function DevelopmentPlansManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  const { employees, isLoading: isEmployeesLoading } = useEmployees();
  const [plans, setPlans] = React.useState<DevelopmentPlan[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [selectedPlan, setSelectedPlan] = React.useState<DevelopmentPlan | null>(null);
  const [editingPlan, setEditingPlan] = React.useState<DevelopmentPlan | null>(null);
  const [form, setForm] = React.useState<PlanFormState>(EMPTY_FORM);
  const [isViewSheetOpen, setIsViewSheetOpen] = React.useState(false);
  const [isFormSheetOpen, setIsFormSheetOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = React.useState<DevelopmentPlan | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadPlans = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await developmentPlansApi.getAll({ pageSize: 200 });
      if (!response.success || !response.data) {
        setPlans([]);
        setError(response.error || t.developmentPlans.loadFailed);
        return;
      }

      setPlans(response.data.plans);
    } catch (loadError) {
      setPlans([]);
      setError(loadError instanceof Error ? loadError.message : t.developmentPlans.loadFailed);
    } finally {
      setIsLoading(false);
    }
  }, [t.developmentPlans.loadFailed]);

  React.useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const filteredPlans = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return plans.filter((plan) => {
      const matchesSearch =
        !query ||
        plan.employeeName.toLowerCase().includes(query) ||
        plan.title.toLowerCase().includes(query);

      const matchesStatus = statusFilter === "all" || plan.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [plans, searchQuery, statusFilter]);

  const stats = React.useMemo(() => {
    const total = plans.length;
    const avgProgress =
      total > 0 ? Math.round(plans.reduce((sum, plan) => sum + plan.progress, 0) / total) : 0;

    return {
      total,
      active: plans.filter((plan) => plan.status === "active").length,
      pendingApproval: plans.filter((plan) => plan.status === "pending-approval").length,
      completed: plans.filter((plan) => plan.status === "completed").length,
      avgProgress
    };
  }, [plans]);

  function updateFormValue<K extends keyof PlanFormState>(key: K, value: PlanFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreateSheet() {
    setEditingPlan(null);
    setForm({
      ...EMPTY_FORM,
      goals: [createEmptyGoal()],
      activities: [createEmptyActivity()]
    });
    setIsFormSheetOpen(true);
  }

  function openEditSheet(plan: DevelopmentPlan) {
    setEditingPlan(plan);
    setForm(buildFormState(plan));
    setIsFormSheetOpen(true);
  }

  function openViewSheet(plan: DevelopmentPlan) {
    setSelectedPlan(plan);
    setIsViewSheetOpen(true);
  }

  function handleFormSheetOpenChange(open: boolean) {
    setIsFormSheetOpen(open);
    if (!open) {
      setEditingPlan(null);
      setForm(EMPTY_FORM);
    }
  }

  function addGoal() {
    setForm((current) => ({
      ...current,
      goals: [...current.goals, createEmptyGoal(current.targetDate)]
    }));
  }

  function updateGoal(goalId: string, changes: Partial<EditablePlanGoal>) {
    setForm((current) => ({
      ...current,
      goals: current.goals.map((goal) =>
        goal.id === goalId ? normalizeEditableGoal({ ...goal, ...changes }) : goal
      )
    }));
  }

  function removeGoal(goalId: string) {
    setForm((current) => ({
      ...current,
      goals: current.goals.filter((goal) => goal.id !== goalId)
    }));
  }

  function addActivity() {
    setForm((current) => ({
      ...current,
      activities: [...current.activities, createEmptyActivity(current.targetDate)]
    }));
  }

  function updateActivity(activityId: string, changes: Partial<EditablePlanActivity>) {
    setForm((current) => ({
      ...current,
      activities: current.activities.map((activity) =>
        activity.id === activityId
          ? normalizeEditableActivity({ ...activity, ...changes })
          : activity
      )
    }));
  }

  function removeActivity(activityId: string) {
    setForm((current) => ({
      ...current,
      activities: current.activities.filter((activity) => activity.id !== activityId)
    }));
  }

  async function handleSave() {
    if (!form.employeeId || form.title.trim().length < 2 || !form.startDate || !form.targetDate) {
      toast.error(t.developmentPlans.fillRequired);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const payload = buildPayload(form);
      const response = editingPlan
        ? await developmentPlansApi.update(editingPlan.id, payload)
        : await developmentPlansApi.create(payload);

      if (!response.success || !response.data) {
        toast.error(response.error || t.developmentPlans.saveFailed);
        return;
      }

      toast.success(editingPlan ? t.developmentPlans.planUpdated : t.developmentPlans.planCreated);
      setIsFormSheetOpen(false);
      setEditingPlan(null);
      setForm(EMPTY_FORM);
      await loadPlans();
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : t.developmentPlans.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(plan: DevelopmentPlan, status: DevelopmentPlanStatus) {
    setUpdatingId(plan.id);
    try {
      const response = await developmentPlansApi.update(plan.id, { status });
      if (!response.success || !response.data) {
        toast.error(response.error || t.developmentPlans.statusUpdateFailed);
        return;
      }

      toast.success(t.developmentPlans.statusUpdated);
      setPlans((current) => current.map((item) => (item.id === plan.id ? response.data! : item)));
      if (selectedPlan?.id === plan.id) {
        setSelectedPlan(response.data);
      }
    } catch (statusError) {
      toast.error(
        statusError instanceof Error ? statusError.message : t.developmentPlans.statusUpdateFailed
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(plan: DevelopmentPlan) {
    setPlanToDelete(plan);
  }

  async function confirmDelete() {
    if (!planToDelete) return;
    const plan = planToDelete;
    setPlanToDelete(null);
    setDeletingId(plan.id);
    try {
      const response = await developmentPlansApi.delete(plan.id);
      if (!response.success) {
        toast.error(response.error || t.developmentPlans.deleteFailed);
        return;
      }

      toast.success(t.developmentPlans.deletedSuccess);
      setPlans((current) => current.filter((item) => item.id !== plan.id));
      if (selectedPlan?.id === plan.id) {
        setIsViewSheetOpen(false);
        setSelectedPlan(null);
      }
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error ? deleteError.message : t.developmentPlans.deleteFailed
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="space-y-6">
        {error && (
          <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.developmentPlans.totalPlans}</CardTitle>
              <IconTarget className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-muted-foreground text-xs">{t.developmentPlans.devPlan}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t.developmentPlans.activePlans}
              </CardTitle>
              <IconProgress className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
              <p className="text-muted-foreground text-xs">{t.common.inProgress}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.documents.pendingApproval}</CardTitle>
              <IconClock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingApproval}</div>
              <p className="text-muted-foreground text-xs">{t.documents.pendingApproval}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.common.completed}</CardTitle>
              <IconCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-muted-foreground text-xs">{t.developmentPlans.completedPlan}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t.developmentPlans.avgProgress}
              </CardTitle>
              <IconTarget className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.avgProgress}%</div>
              <p className="text-muted-foreground text-xs">{t.developmentPlans.forAllPlans}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>{t.developmentPlans.pageTitle}</CardTitle>
                <CardDescription>{t.developmentPlans.pageSubtitle}</CardDescription>
              </div>
              <Button onClick={openCreateSheet}>
                <IconPlus className="ms-2 h-4 w-4" />
                {t.developmentPlans.newPlan}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <IconSearch className="text-muted-foreground absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder={t.developmentPlans.searchPlaceholder}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="ps-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t.common.status} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.common.allStatuses}</SelectItem>
                  {Object.entries(developmentPlanStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.common.employee}</TableHead>
                    <TableHead>{t.developmentPlans.planTitle}</TableHead>
                    <TableHead>{t.performanceGoals.dueDate}</TableHead>
                    <TableHead>{t.common.inProgress}</TableHead>
                    <TableHead>{t.common.status}</TableHead>
                    <TableHead className="text-start">{t.common.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                        {t.developmentPlans.loadingPlans}
                      </TableCell>
                    </TableRow>
                  ) : filteredPlans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center">
                        <p className="text-muted-foreground">
                          {t.developmentPlans.noMatchingPlans}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={plan.employeeAvatar} alt="" />
                              <AvatarFallback>
                                {plan.employeeName
                                  .split(" ")
                                  .map((part) => part[0])
                                  .join("")
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{plan.employeeName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <p className="font-medium">{plan.title}</p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">
                                {developmentPlanTypeLabels[plan.type]}
                              </Badge>
                              <Badge className={developmentPlanPriorityColors[plan.priority]}>
                                {developmentPlanPriorityLabels[plan.priority]}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(plan.targetDate)}</TableCell>
                        <TableCell>
                          <div className="flex w-24 items-center gap-2">
                            <Progress value={plan.progress} className="h-2" />
                            <span className="text-muted-foreground text-xs">{plan.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={developmentPlanStatusColors[plan.status]}>
                            {developmentPlanStatusLabels[plan.status]}
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
                              <DropdownMenuItem onClick={() => openViewSheet(plan)}>
                                <IconEye className="ms-2 h-4 w-4" />
                                {t.common.viewDetails}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditSheet(plan)}>
                                <IconEdit className="ms-2 h-4 w-4" />
                                {t.common.edit}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {plan.status === "draft" && (
                                <DropdownMenuItem
                                  disabled={updatingId === plan.id}
                                  onClick={() => void handleStatusChange(plan, "pending-approval")}>
                                  <IconCheck className="ms-2 h-4 w-4" />
                                  {t.developmentPlans.submitForApproval}
                                </DropdownMenuItem>
                              )}
                              {plan.status !== "active" &&
                                plan.status !== "completed" &&
                                plan.status !== "cancelled" && (
                                  <DropdownMenuItem
                                    disabled={updatingId === plan.id}
                                    onClick={() => void handleStatusChange(plan, "active")}>
                                    <IconPlayerPlay className="ms-2 h-4 w-4" />
                                    {t.common.startExecution}
                                  </DropdownMenuItem>
                                )}
                              {plan.status !== "completed" && (
                                <DropdownMenuItem
                                  disabled={updatingId === plan.id}
                                  onClick={() => void handleStatusChange(plan, "completed")}>
                                  <IconCheck className="ms-2 h-4 w-4" />
                                  {t.developmentPlans.markAsComplete}
                                </DropdownMenuItem>
                              )}
                              {plan.status !== "cancelled" && plan.status !== "completed" && (
                                <DropdownMenuItem
                                  disabled={updatingId === plan.id}
                                  onClick={() => void handleStatusChange(plan, "cancelled")}>
                                  <IconX className="ms-2 h-4 w-4" />
                                  {t.developmentPlans.cancelPlan}
                                </DropdownMenuItem>
                              )}
                              {plan.status === "cancelled" && (
                                <DropdownMenuItem
                                  disabled={updatingId === plan.id}
                                  onClick={() => void handleStatusChange(plan, "draft")}>
                                  <IconEdit className="ms-2 h-4 w-4" />
                                  {t.developmentPlans.reopenAsDraft}
                                </DropdownMenuItem>
                              )}
                              {plan.status !== "completed" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    disabled={deletingId === plan.id}
                                    onClick={() => void handleDelete(plan)}>
                                    <IconTrash className="ms-2 h-4 w-4" />
                                    {deletingId === plan.id
                                      ? t.common.deleting
                                      : t.developmentPlans.deletePlan}
                                  </DropdownMenuItem>
                                </>
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

        <Sheet open={isFormSheetOpen} onOpenChange={handleFormSheetOpenChange}>
          <SheetContent className="overflow-y-auto sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>
                {editingPlan ? t.developmentPlans.editPlan : t.developmentPlans.createPlan}
              </SheetTitle>
              <SheetDescription>{t.developmentPlans.formDesc}</SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t.common.employee}</Label>
                <Select
                  value={form.employeeId}
                  onValueChange={(value) => updateFormValue("employeeId", value)}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isEmployeesLoading
                          ? t.developmentPlans.loadingEmployees
                          : t.common.selectEmployee
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>{t.developmentPlans.planTitle}</Label>
                <Input
                  value={form.title}
                  onChange={(event) => updateFormValue("title", event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>{t.common.description}</Label>
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => updateFormValue("description", event.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>{t.common.startDate}</Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(event) => updateFormValue("startDate", event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t.performanceGoals.dueDate}</Label>
                  <Input
                    type="date"
                    value={form.targetDate}
                    onChange={(event) => updateFormValue("targetDate", event.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>{t.common.status}</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      updateFormValue("status", value as DevelopmentPlanStatus)
                    }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(developmentPlanStatusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>{t.developmentPlans.mentor}</Label>
                  <Select
                    value={form.mentorId || "none"}
                    onValueChange={(value) =>
                      updateFormValue("mentorId", value === "none" ? "" : value)
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder={t.developmentPlans.chooseMentor} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t.developmentPlans.noMentor}</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>{t.developmentPlans.planType}</Label>
                  <Select
                    value={form.type}
                    onValueChange={(value) =>
                      updateFormValue("type", value as DevelopmentPlanType)
                    }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(developmentPlanTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>{t.common.priority}</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(value) =>
                      updateFormValue("priority", value as DevelopmentPlanPriority)
                    }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(developmentPlanPriorityLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>{t.developmentPlans.goalsSection}</Label>
                    <p className="text-muted-foreground text-sm">
                      {t.developmentPlans.goalsDescription}
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addGoal}>
                    <IconPlus className="ms-2 h-4 w-4" />
                    {t.performanceGoals.addGoal}
                  </Button>
                </div>

                {form.goals.length === 0 ? (
                  <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                    {t.developmentPlans.noGoalsYet}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.goals.map((goal, index) => (
                      <div key={goal.id} className="bg-muted/20 space-y-3 rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">
                            {t.developmentPlans.goalN} {index + 1}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeGoal(goal.id)}>
                            <IconTrash className="ms-2 h-4 w-4" />
                            {t.common.delete}
                          </Button>
                        </div>

                        <div className="grid gap-2">
                          <Label>{t.common.title}</Label>
                          <Input
                            value={goal.title}
                            onChange={(event) => updateGoal(goal.id, { title: event.target.value })}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label>{t.common.description}</Label>
                          <Textarea
                            rows={2}
                            value={goal.description}
                            onChange={(event) =>
                              updateGoal(goal.id, { description: event.target.value })
                            }
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="grid gap-2">
                            <Label>{t.performanceGoals.dueDate}</Label>
                            <Input
                              type="date"
                              value={goal.targetDate}
                              onChange={(event) =>
                                updateGoal(goal.id, { targetDate: event.target.value })
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>{t.common.status}</Label>
                            <Select
                              value={goal.status}
                              onValueChange={(value) =>
                                updateGoal(goal.id, { status: value as DevelopmentGoal["status"] })
                              }>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="not-started">{t.common.notStarted}</SelectItem>
                                <SelectItem value="in-progress">{t.common.inProgress}</SelectItem>
                                <SelectItem value="completed">{t.common.completed}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="grid gap-2">
                            <Label>{t.developmentPlans.completionPercentage}</Label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={goal.progress}
                              onChange={(event) =>
                                updateGoal(goal.id, { progress: Number(event.target.value || 0) })
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>{t.developmentPlans.completionDate}</Label>
                            <Input
                              type="date"
                              value={goal.completedDate}
                              disabled={goal.status !== "completed"}
                              onChange={(event) =>
                                updateGoal(goal.id, { completedDate: event.target.value })
                              }
                            />
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label>{t.developmentPlans.measurementIndicators}</Label>
                          <Textarea
                            rows={2}
                            value={goal.metrics}
                            onChange={(event) =>
                              updateGoal(goal.id, { metrics: event.target.value })
                            }
                            placeholder={t.developmentPlans.indicatorsExample}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>{t.developmentPlans.activitiesSection}</Label>
                    <p className="text-muted-foreground text-sm">
                      {t.developmentPlans.activitiesDescription}
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addActivity}>
                    <IconPlus className="ms-2 h-4 w-4" />
                    {t.developmentPlans.addActivity}
                  </Button>
                </div>

                {form.activities.length === 0 ? (
                  <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                    {t.developmentPlans.noActivitiesYet}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.activities.map((activity, index) => (
                      <div
                        key={activity.id}
                        className="bg-muted/20 space-y-3 rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">
                            {t.developmentPlans.activityN} {index + 1}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeActivity(activity.id)}>
                            <IconTrash className="ms-2 h-4 w-4" />
                            {t.common.delete}
                          </Button>
                        </div>

                        <div className="grid gap-2">
                          <Label>{t.common.title}</Label>
                          <Input
                            value={activity.title}
                            onChange={(event) =>
                              updateActivity(activity.id, { title: event.target.value })
                            }
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="grid gap-2">
                            <Label>{t.common.type}</Label>
                            <Select
                              value={activity.type}
                              onValueChange={(value) =>
                                updateActivity(activity.id, {
                                  type: value as DevelopmentActivity["type"]
                                })
                              }>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(activityTypeLabels).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label>{t.developmentPlans.linkOrReference}</Label>
                            <Input
                              value={activity.courseId}
                              onChange={(event) =>
                                updateActivity(activity.id, { courseId: event.target.value })
                              }
                              placeholder={t.developmentPlans.linkPlaceholder}
                            />
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label>{t.common.description}</Label>
                          <Textarea
                            rows={2}
                            value={activity.description}
                            onChange={(event) =>
                              updateActivity(activity.id, { description: event.target.value })
                            }
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="grid gap-2">
                            <Label>{t.developmentPlans.targetDate}</Label>
                            <Input
                              type="date"
                              value={activity.dueDate}
                              onChange={(event) =>
                                updateActivity(activity.id, { dueDate: event.target.value })
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>{t.common.status}</Label>
                            <Select
                              value={activity.status}
                              onValueChange={(value) =>
                                updateActivity(activity.id, {
                                  status: value as DevelopmentActivity["status"]
                                })
                              }>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">{t.common.pending}</SelectItem>
                                <SelectItem value="in-progress">{t.common.inProgress}</SelectItem>
                                <SelectItem value="completed">{t.common.completed}</SelectItem>
                                <SelectItem value="skipped">{t.common.skipped}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label>{t.developmentPlans.completionDate}</Label>
                          <Input
                            type="date"
                            value={activity.completedDate}
                            disabled={activity.status !== "completed"}
                            onChange={(event) =>
                              updateActivity(activity.id, { completedDate: event.target.value })
                            }
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label>{t.common.notes}</Label>
                          <Textarea
                            rows={2}
                            value={activity.notes}
                            onChange={(event) =>
                              updateActivity(activity.id, { notes: event.target.value })
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label>{t.common.notes}</Label>
                <Textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) => updateFormValue("notes", event.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleFormSheetOpenChange(false)}>
                  {t.common.cancel}
                </Button>
                <Button onClick={() => void handleSave()} disabled={isSaving}>
                  {editingPlan ? t.common.saveChanges : t.developmentPlans.createPlan}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
          <SheetContent className="overflow-y-auto sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>{selectedPlan?.title}</SheetTitle>
              <SheetDescription>{t.developmentPlans.planDetails}</SheetDescription>
            </SheetHeader>
            {selectedPlan && (
              <div className="space-y-6 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedPlan.employeeAvatar} alt="" />
                    <AvatarFallback>
                      {selectedPlan.employeeName
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedPlan.employeeName}</h3>
                    <Badge className={developmentPlanStatusColors[selectedPlan.status]}>
                      {developmentPlanStatusLabels[selectedPlan.status]}
                    </Badge>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{t.onboarding.totalProgress}</span>
                    <span>{selectedPlan.progress}%</span>
                  </div>
                  <Progress value={selectedPlan.progress} className="h-3" />
                </div>

                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">{t.common.startDate}</p>
                    <p className="font-medium">{formatDate(selectedPlan.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t.performanceGoals.dueDate}</p>
                    <p className="font-medium">{formatDate(selectedPlan.targetDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t.developmentPlans.planType}</p>
                    <p className="font-medium">{developmentPlanTypeLabels[selectedPlan.type]}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t.common.priority}</p>
                    <Badge className={developmentPlanPriorityColors[selectedPlan.priority]}>
                      {developmentPlanPriorityLabels[selectedPlan.priority]}
                    </Badge>
                  </div>
                </div>

                {(selectedPlan.description || selectedPlan.notes) && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      {selectedPlan.description && (
                        <div>
                          <h4 className="mb-2 font-semibold">
                            {t.developmentPlans.planDescription}
                          </h4>
                          <p className="bg-muted/40 rounded-lg p-3 text-sm leading-6">
                            {selectedPlan.description}
                          </p>
                        </div>
                      )}
                      {selectedPlan.notes && (
                        <div>
                          <h4 className="mb-2 font-semibold">{t.developmentPlans.generalNotes}</h4>
                          <p className="bg-muted/40 rounded-lg p-3 text-sm leading-6">
                            {selectedPlan.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {selectedPlan.mentor && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="mb-3 font-semibold">{t.developmentPlans.mentor}</h4>
                      <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={selectedPlan.mentor.avatar} alt="" />
                          <AvatarFallback>
                            {selectedPlan.mentor.name
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{selectedPlan.mentor.name}</p>
                          <p className="text-muted-foreground text-sm">
                            {selectedPlan.mentor.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div>
                  <h4 className="mb-3 font-semibold">{t.developmentPlans.goalsSection}</h4>
                  <div className="space-y-3">
                    {selectedPlan.goals.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        {t.developmentPlans.noGoalsForThisPlan}
                      </p>
                    ) : (
                      selectedPlan.goals.map((goal) => (
                        <div key={goal.id} className="rounded-lg border p-3">
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <p className="font-medium">{goal.title}</p>
                            <Badge className={getGoalStatusColor(goal.status)}>
                              {getGoalStatusLabel(goal.status)}
                            </Badge>
                          </div>
                          {goal.description && (
                            <p className="text-muted-foreground mb-2 text-sm">{goal.description}</p>
                          )}
                          <Progress value={goal.progress} className="h-2" />
                          <div className="text-muted-foreground mt-2 flex flex-wrap gap-3 text-xs">
                            <span>
                              {t.developmentPlans.dueDate} {formatDate(goal.targetDate)}
                            </span>
                            {goal.completedDate && (
                              <span>
                                {t.developmentPlans.completedDate} {formatDate(goal.completedDate)}
                              </span>
                            )}
                            {goal.metrics && (
                              <span>
                                {t.developmentPlans.metrics} {goal.metrics}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-3 font-semibold">{t.developmentPlans.activitiesSection}</h4>
                  <div className="space-y-2">
                    {selectedPlan.activities.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        {t.developmentPlans.noRelatedActivities}
                      </p>
                    ) : (
                      selectedPlan.activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center gap-3 rounded-lg border p-2">
                          <Checkbox checked={activity.status === "completed"} disabled />
                          <div className="flex-1">
                            <p
                              className={`text-sm ${activity.status === "completed" ? "text-muted-foreground line-through" : ""}`}>
                              {activity.title}
                            </p>
                            {activity.description && (
                              <p className="text-muted-foreground mt-1 text-xs">
                                {activity.description}
                              </p>
                            )}
                            <div className="mt-1 flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                {activityTypeLabels[activity.type]}
                              </Badge>
                              <Badge className={getActivityStatusColor(activity.status)}>
                                {getActivityStatusLabel(activity.status)}
                              </Badge>
                              <span className="text-muted-foreground text-xs">
                                {formatDate(activity.dueDate)}
                              </span>
                              {activity.completedDate && (
                                <span className="text-muted-foreground text-xs">
                                  {t.developmentPlans.completedOn}{" "}
                                  {formatDate(activity.completedDate)}
                                </span>
                              )}
                            </div>
                            {activity.notes && (
                              <p className="text-muted-foreground mt-1 text-xs">{activity.notes}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>

      <AlertDialog
        open={!!planToDelete}
        onOpenChange={(open) => {
          if (!open) setPlanToDelete(null);
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.common.confirmDeleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.developmentPlans.pAreYouSureYouWantToDelete} &ldquo;{planToDelete?.title}&rdquo;?{" "}
              {t.developmentPlans.deleteConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
