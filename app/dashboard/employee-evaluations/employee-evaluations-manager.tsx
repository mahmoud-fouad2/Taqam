"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconEye,
  IconCheck,
  IconDots,
  IconClipboardCheck,
  IconUser,
  IconUsers,
  IconSearch,
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
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  EmployeeEvaluation,
  EvaluationReview,
  EmployeeEvaluationStatus,
  employeeEvaluationStatusLabels,
  employeeEvaluationStatusColors,
  formatScore,
  getRatingByScore,
  defaultPerformanceRatings,
} from "@/lib/types/performance";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

type RawEvaluation = {
  id: string;
  tenantId: string;
  cycleId: string;
  evaluatorId?: string | null;
  status: string;
  overallScore?: number | null;
  overallRating?: string | null;
  strengths?: string | null;
  areasForImprovement?: string | null;
  comments?: string | null;
  employeeComments?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  employeeAcknowledgedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  cycle?: {
    id: string;
    name: string;
    nameAr?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  } | null;
  employee: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    firstNameAr?: string | null;
    lastNameAr?: string | null;
    avatar?: string | null;
    department?: { name?: string | null; nameAr?: string | null } | null;
    jobTitle?: { name?: string | null; nameAr?: string | null } | null;
  };
  evaluator?: {
    firstName: string;
    lastName: string;
    firstNameAr?: string | null;
    lastNameAr?: string | null;
  } | null;
};

type EvaluationsResponse = {
  evaluations?: RawEvaluation[];
};

type CyclesResponse = {
  data?: Array<{
    id: string;
    name: string;
    nameEn?: string;
  }>;
};

type ProfileResponse = {
  data?: {
    role?: string;
    employee?: { id?: string } | null;
  };
};

type ReviewFormState = {
  score: number;
  comments: string;
  strengths: string;
  improvements: string;
};

const INITIAL_REVIEW_FORM: ReviewFormState = {
  score: 3,
  comments: "",
  strengths: "",
  improvements: "",
};

const REVIEWER_ROLES = ["SUPER_ADMIN", "TENANT_ADMIN", "HR_MANAGER"];

function splitMultiline(value: string | null | undefined): string[] {
  return (value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ar-SA");
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ar-SA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPersonName(person?: {
  firstName?: string | null;
  lastName?: string | null;
  firstNameAr?: string | null;
  lastNameAr?: string | null;
} | null) {
  if (!person) return "-";
  return `${person.firstNameAr || person.firstName || ""} ${person.lastNameAr || person.lastName || ""}`.trim() || "-";
}

function mapEvaluationStatus(item: RawEvaluation): EmployeeEvaluationStatus {
  if (item.employeeAcknowledgedAt) return "completed";
  if (item.status === "CANCELLED") return "cancelled";
  if (item.status === "COMPLETED") return "pending_acknowledgment";
  return "pending_manager_review";
}

function mapManagerReview(item: RawEvaluation): EvaluationReview | undefined {
  if (
    item.overallScore == null &&
    !item.comments &&
    !item.strengths &&
    !item.areasForImprovement
  ) {
    return undefined;
  }

  return {
    reviewType: "manager",
    reviewerId: item.evaluatorId ?? undefined,
    reviewerName: getPersonName(item.evaluator),
    score: Number(item.overallScore ?? 0),
    comments: item.comments ?? undefined,
    strengths: splitMultiline(item.strengths),
    improvements: splitMultiline(item.areasForImprovement),
    submittedAt: item.reviewedAt || item.submittedAt || item.updatedAt,
  };
}

function mapEvaluation(item: RawEvaluation): EmployeeEvaluation {
  const managerReview = mapManagerReview(item);

  return {
    id: item.id,
    tenantId: item.tenantId,
    cycleId: item.cycleId,
    cycleName: item.cycle?.nameAr || item.cycle?.name || "-",
    employeeId: item.employee.id,
    employeeName: getPersonName(item.employee),
    employeeNumber: item.employee.employeeNumber,
    employeeAvatar: item.employee.avatar ?? undefined,
    departmentId: "",
    departmentName: item.employee.department?.nameAr || item.employee.department?.name || "-",
    jobTitleId: "",
    jobTitle: item.employee.jobTitle?.nameAr || item.employee.jobTitle?.name || "-",
    managerId: item.evaluatorId || "",
    managerName: getPersonName(item.evaluator),
    templateId: "",
    templateName: undefined,
    periodStart: item.cycle?.startDate ?? undefined,
    periodEnd: item.cycle?.endDate ?? undefined,
    managerReview,
    finalScore: item.overallScore != null ? Number(item.overallScore) : undefined,
    rating: item.overallRating ?? undefined,
    strengths: item.strengths ?? undefined,
    improvements: item.areasForImprovement ?? undefined,
    managerComments: item.comments ?? undefined,
    employeeComments: item.employeeComments ?? undefined,
    status: mapEvaluationStatus(item),
    managerReviewDate: item.reviewedAt || item.submittedAt || undefined,
    acknowledgedDate: item.employeeAcknowledgedAt || undefined,
    completedDate: item.reviewedAt || undefined,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function EmployeeEvaluationsManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  const [evaluations, setEvaluations] = useState<EmployeeEvaluation[]>([]);
  const [cycles, setCycles] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState<EmployeeEvaluation | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "mine" | "assigned">("all");
  const [filterCycle, setFilterCycle] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<EmployeeEvaluationStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewForm, setReviewForm] = useState<ReviewFormState>(INITIAL_REVIEW_FORM);

  const canReviewAll = currentUserRole ? REVIEWER_ROLES.includes(currentUserRole) : false;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profileRes, evaluationsRes, cyclesRes] = await Promise.all([
        fetch("/api/profile", { cache: "no-store" }),
        fetch("/api/evaluations", { cache: "no-store" }),
        fetch("/api/performance/cycles", { cache: "no-store" }),
      ]);

      const profileJson = (await profileRes.json()) as ProfileResponse;
      const evaluationsJson = (await evaluationsRes.json()) as EvaluationsResponse;
      const cyclesJson = (await cyclesRes.json()) as CyclesResponse;

      if (!profileRes.ok) {
        throw new Error(t.evaluations.loadUserFailed);
      }
      if (!evaluationsRes.ok) {
        throw new Error(t.evaluations.loadFailed);
      }
      if (!cyclesRes.ok) {
        throw new Error(t.evaluations.loadCyclesFailed);
      }

      setCurrentUserId(
        typeof profileJson.data?.employee?.id === "string" ? profileJson.data.employee.id : null
      );
      setCurrentUserRole(typeof profileJson.data?.role === "string" ? profileJson.data.role : null);

      setEvaluations(Array.isArray(evaluationsJson.evaluations) ? evaluationsJson.evaluations.map(mapEvaluation) : []);
      setCycles(
        Array.isArray(cyclesJson.data)
          ? cyclesJson.data.map((cycle) => ({ id: cycle.id, name: cycle.name || cycle.nameEn || "-" }))
          : []
      );
    } catch (error) {
      setEvaluations([]);
      setCycles([]);
      toast.error(error instanceof Error ? error.message : t.evaluations.loadFailed);
    } finally {
      setIsLoading(false);
    }
  }, [t.evaluations.loadCyclesFailed, t.evaluations.loadFailed, t.evaluations.loadUserFailed]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const sourceEvaluations = useMemo(() => {
    if (activeTab === "mine") {
      return currentUserId ? evaluations.filter((evaluation) => evaluation.employeeId === currentUserId) : [];
    }

    if (activeTab === "assigned") {
      return evaluations.filter(
        (evaluation) => canReviewAll || (currentUserId != null && evaluation.managerId === currentUserId)
      );
    }

    return evaluations;
  }, [activeTab, canReviewAll, currentUserId, evaluations]);

  const filteredEvaluations = useMemo(() => {
    return sourceEvaluations.filter((evaluation) => {
      if (filterCycle !== "all" && evaluation.cycleId !== filterCycle) return false;
      if (filterStatus !== "all" && evaluation.status !== filterStatus) return false;
      if (
        searchQuery &&
        !evaluation.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !evaluation.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [sourceEvaluations, filterCycle, filterStatus, searchQuery]);

  const stats = useMemo(() => {
    const scored = evaluations.filter((evaluation) => evaluation.finalScore != null);
    const avgScore =
      scored.length > 0
        ? scored.reduce((sum, evaluation) => sum + Number(evaluation.finalScore || 0), 0) / scored.length
        : 0;

    return {
      total: evaluations.length,
      inReview: evaluations.filter((evaluation) => evaluation.status === "pending_manager_review").length,
      pendingAcknowledgment: evaluations.filter((evaluation) => evaluation.status === "pending_acknowledgment").length,
      completed: evaluations.filter((evaluation) => evaluation.status === "completed").length,
      avgScore,
    };
  }, [evaluations]);

  const canReviewEvaluation = useCallback(
    (evaluation: EmployeeEvaluation) => {
      if (evaluation.status === "completed" || evaluation.status === "pending_acknowledgment" || evaluation.status === "cancelled") {
        return false;
      }

      return canReviewAll || (currentUserId != null && evaluation.managerId === currentUserId);
    },
    [canReviewAll, currentUserId]
  );

  const canAcknowledgeEvaluation = useCallback(
    (evaluation: EmployeeEvaluation) => {
      return currentUserId != null && evaluation.employeeId === currentUserId && evaluation.status === "pending_acknowledgment";
    },
    [currentUserId]
  );

  const openView = (evaluation: EmployeeEvaluation) => {
    setSelectedEvaluation(evaluation);
    setIsViewDialogOpen(true);
  };

  const openReview = (evaluation: EmployeeEvaluation) => {
    setSelectedEvaluation(evaluation);
    setReviewForm({
      score: evaluation.finalScore ?? evaluation.managerReview?.score ?? INITIAL_REVIEW_FORM.score,
      comments: evaluation.managerComments ?? evaluation.managerReview?.comments ?? "",
      strengths: evaluation.strengths ?? evaluation.managerReview?.strengths?.join("\n") ?? "",
      improvements: evaluation.improvements ?? evaluation.managerReview?.improvements?.join("\n") ?? "",
    });
    setIsReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedEvaluation) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/evaluations/${selectedEvaluation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallScore: reviewForm.score,
          comments: reviewForm.comments || null,
          strengths: reviewForm.strengths || null,
          areasForImprovement: reviewForm.improvements || null,
          status: "COMPLETED",
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error || t.evaluations.saveFailed);
      }

      toast.success(t.evaluations.savedSuccess);
      setIsReviewDialogOpen(false);
      setSelectedEvaluation(null);
      setReviewForm(INITIAL_REVIEW_FORM);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.evaluations.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAcknowledge = async (evaluationId: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/evaluations/${evaluationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACKNOWLEDGED" }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error || t.evaluations.acknowledgeFailed);
      }

      toast.success(t.evaluations.acknowledgedSuccess);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.evaluations.acknowledgeFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const getRatingLabel = (score: number) => {
    const rating = getRatingByScore(score, defaultPerformanceRatings);
    return rating?.label || t.common.unspecified;
  };

  const getRatingColor = (score: number) => {
    const rating = getRatingByScore(score, defaultPerformanceRatings);
    return rating?.color || "#6B7280";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t.evaluations.title}</h2>
          <p className="text-muted-foreground">{t.evaluations.subtitle}</p>
        </div>
        <Button variant="outline" onClick={() => void loadData()} disabled={isLoading || isSaving}>{t.common.refresh}</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.evaluations.total}</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.evaluations.underReview}</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{stats.inReview}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.evaluations.pendingAcknowledgement}</CardDescription>
            <CardTitle className="text-3xl text-teal-600">{stats.pendingAcknowledgment}</CardTitle>
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
            <CardDescription>{t.evaluations.avgRating}</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{formatScore(stats.avgScore)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative max-w-sm flex-1">
          <IconSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.evaluations.searchPlaceholder}
            className="ps-9"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <Select value={filterCycle} onValueChange={setFilterCycle}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder={t.evaluations.evaluationCycle} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.trainingCourses.allCourses}</SelectItem>
            {cycles.map((cycle) => (
              <SelectItem key={cycle.id} value={cycle.id}>
                {cycle.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as EmployeeEvaluationStatus | "all")}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder={t.common.status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.common.allStatuses}</SelectItem>
            {Object.entries(employeeEvaluationStatusLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "mine" | "assigned")}>
        <TabsList>
          <TabsTrigger value="all">{t.common.all}</TabsTrigger>
          <TabsTrigger value="mine">{t.evaluations.myEvaluations}</TabsTrigger>
          <TabsTrigger value="assigned">{t.evaluations.assignedToMe}</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <EvaluationsTable
            evaluations={filteredEvaluations}
            isLoading={isLoading}
            onView={openView}
            onReview={openReview}
            onAcknowledge={handleAcknowledge}
            canReviewEvaluation={canReviewEvaluation}
            canAcknowledgeEvaluation={canAcknowledgeEvaluation}
            getRatingLabel={getRatingLabel}
            getRatingColor={getRatingColor}
          />
        </TabsContent>

        <TabsContent value="mine">
          <EvaluationsTable
            evaluations={filteredEvaluations}
            isLoading={isLoading}
            onView={openView}
            onReview={openReview}
            onAcknowledge={handleAcknowledge}
            canReviewEvaluation={canReviewEvaluation}
            canAcknowledgeEvaluation={canAcknowledgeEvaluation}
            getRatingLabel={getRatingLabel}
            getRatingColor={getRatingColor}
          />
        </TabsContent>

        <TabsContent value="assigned">
          <EvaluationsTable
            evaluations={filteredEvaluations}
            isLoading={isLoading}
            onView={openView}
            onReview={openReview}
            onAcknowledge={handleAcknowledge}
            canReviewEvaluation={canReviewEvaluation}
            canAcknowledgeEvaluation={canAcknowledgeEvaluation}
            getRatingLabel={getRatingLabel}
            getRatingColor={getRatingColor}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-full max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.evaluations.evalDetails}</DialogTitle>
            <DialogDescription>
              {selectedEvaluation ? `${t.evaluations.pViewEvaluation} ${selectedEvaluation.employeeName}` : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedEvaluation && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedEvaluation.employeeAvatar} alt="" />
                  <AvatarFallback className="text-xl">
                    {selectedEvaluation.employeeName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedEvaluation.employeeName}</h3>
                  <p className="text-muted-foreground">
                    {selectedEvaluation.jobTitle} - {selectedEvaluation.departmentName}
                  </p>
                  <Badge className={`mt-2 ${employeeEvaluationStatusColors[selectedEvaluation.status]}`}>
                    {employeeEvaluationStatusLabels[selectedEvaluation.status]}
                  </Badge>
                </div>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t.evaluations.cycleInfo}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{t.trainingCourses.course}</p>
                      <p className="font-medium">{selectedEvaluation.cycleName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t.leaveRequests.period}</p>
                      <p className="font-medium">
                        {formatDate(selectedEvaluation.periodStart)} - {formatDate(selectedEvaluation.periodEnd)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t.evaluations.reviewer}</p>
                      <p className="font-medium">{selectedEvaluation.managerName || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <IconClipboardCheck className="h-4 w-4" />
                      {t.evaluations.pPerformanceReview}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedEvaluation.managerReview ? (
                      <div className="space-y-3">
                        <div className="rounded-lg bg-muted p-4 text-center">
                          <p className="text-3xl font-bold text-green-600">
                            {formatScore(selectedEvaluation.managerReview.score)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getRatingLabel(selectedEvaluation.managerReview.score)}
                          </p>
                        </div>
                        {selectedEvaluation.managerReview.comments && (
                          <div>
                            <p className="mb-1 text-sm text-muted-foreground">{t.evaluations.notes}</p>
                            <p className="text-sm">{selectedEvaluation.managerReview.comments}</p>
                          </div>
                        )}
                        {selectedEvaluation.managerReview.strengths && selectedEvaluation.managerReview.strengths.length > 0 && (
                          <div>
                            <p className="mb-1 text-sm text-muted-foreground">{t.common.notes}</p>
                            <ul className="list-inside list-disc text-sm">
                              {selectedEvaluation.managerReview.strengths.map((item, index) => (
                                <li key={`${item}-${index}`}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedEvaluation.managerReview.improvements && selectedEvaluation.managerReview.improvements.length > 0 && (
                          <div>
                            <p className="mb-1 text-sm text-muted-foreground">{t.evaluations.improvementAreas}</p>
                            <ul className="list-inside list-disc text-sm">
                              {selectedEvaluation.managerReview.improvements.map((item, index) => (
                                <li key={`${item}-${index}`}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="py-4 text-center text-muted-foreground">{t.evaluations.noReviewEntered}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <IconUser className="h-4 w-4" />
                      {t.evaluations.pEmployeeComments}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedEvaluation.employeeComments ? (
                      <p className="text-sm leading-6">{selectedEvaluation.employeeComments}</p>
                    ) : (
                      <p className="py-4 text-center text-muted-foreground">{t.evaluations.noEmployeeComments}</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {selectedEvaluation.finalScore != null && (
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="mb-2 text-sm text-muted-foreground">{t.evaluations.finalScore}</p>
                      <p className="mb-2 text-5xl font-bold">{formatScore(selectedEvaluation.finalScore)}</p>
                      <Badge
                        className="px-4 py-1 text-lg"
                        style={{
                          backgroundColor: `${getRatingColor(selectedEvaluation.finalScore)}20`,
                          color: getRatingColor(selectedEvaluation.finalScore),
                        }}
                      >
                        {getRatingLabel(selectedEvaluation.finalScore)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>{t.common.close}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="w-full max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t.evaluations.reviewRating}</DialogTitle>
            <DialogDescription>
              {selectedEvaluation ? `${t.evaluations.pEnterReview} ${selectedEvaluation.employeeName} - ${selectedEvaluation.cycleName}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <Label>{t.evaluations.finalGrade}</Label>
              <div className="rounded-lg bg-muted p-6 text-center">
                <p className="mb-2 text-5xl font-bold text-blue-600">{formatScore(reviewForm.score)}</p>
                <p className="text-muted-foreground">{getRatingLabel(reviewForm.score)}</p>
              </div>
              <Slider
                value={[reviewForm.score]}
                onValueChange={([value]) => setReviewForm((current) => ({ ...current, score: value }))}
                max={5}
                min={1}
                step={0.1}
                className="py-4"
              />
            </div>

            <div className="space-y-2">
              <Label>{t.evaluations.reviewerNotes}</Label>
              <Textarea
                rows={3}
                value={reviewForm.comments}
                onChange={(event) => setReviewForm((current) => ({ ...current, comments: event.target.value }))}
                placeholder={t.evaluations.reviewSummary}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t.common.notes}</Label>
                <Textarea
                  rows={4}
                  value={reviewForm.strengths}
                  onChange={(event) => setReviewForm((current) => ({ ...current, strengths: event.target.value }))}
                  placeholder={t.common.linePerPoint}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.evaluations.improvementAreas}</Label>
                <Textarea
                  rows={4}
                  value={reviewForm.improvements}
                  onChange={(event) => setReviewForm((current) => ({ ...current, improvements: event.target.value }))}
                  placeholder={t.common.linePerPoint}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReviewDialogOpen(false);
                setSelectedEvaluation(null);
                setReviewForm(INITIAL_REVIEW_FORM);
              }}
            >{t.common.cancel}</Button>
            <Button onClick={handleSubmitReview} disabled={isSaving}>
              {t.evaluations.pSaveReview}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type EvaluationsTableProps = {
  evaluations: EmployeeEvaluation[];
  isLoading: boolean;
  onView: (evaluation: EmployeeEvaluation) => void;
  onReview: (evaluation: EmployeeEvaluation) => void;
  onAcknowledge: (evaluationId: string) => void;
  canReviewEvaluation: (evaluation: EmployeeEvaluation) => boolean;
  canAcknowledgeEvaluation: (evaluation: EmployeeEvaluation) => boolean;
  getRatingLabel: (score: number) => string;
  getRatingColor: (score: number) => string;
};

function EvaluationsTable({
  evaluations,
  isLoading,
  onView,
  onReview,
  onAcknowledge,
  canReviewEvaluation,
  canAcknowledgeEvaluation,
  getRatingLabel,
  getRatingColor,
}: EvaluationsTableProps) {
  return (
    <Card>
      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.common.employee}</TableHead>
            <TableHead>{t.common.department}</TableHead>
            <TableHead>{t.evaluations.evaluationCycle}</TableHead>
            <TableHead>{t.common.status}</TableHead>
            <TableHead>{t.evaluations.result}</TableHead>
            <TableHead>{t.myRequests.lastUpdated}</TableHead>
            <TableHead className="w-[100px]">{t.common.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                {t.evaluations.pLoadingEvaluations}
              </TableCell>
            </TableRow>
          ) : evaluations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                {t.evaluations.pNoEvaluationsMatchTheCurrentFi}
              </TableCell>
            </TableRow>
          ) : (
            evaluations.map((evaluation) => (
              <TableRow key={evaluation.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={evaluation.employeeAvatar} alt="" />
                      <AvatarFallback>{evaluation.employeeName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{evaluation.employeeName}</div>
                      <div className="text-xs text-muted-foreground">{evaluation.jobTitle}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{evaluation.departmentName}</TableCell>
                <TableCell>{evaluation.cycleName}</TableCell>
                <TableCell>
                  <Badge className={employeeEvaluationStatusColors[evaluation.status]}>
                    {employeeEvaluationStatusLabels[evaluation.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {evaluation.finalScore != null ? (
                    <div className="flex items-center gap-2">
                      <Badge
                        style={{
                          backgroundColor: `${getRatingColor(evaluation.finalScore)}20`,
                          color: getRatingColor(evaluation.finalScore),
                        }}
                      >
                        {formatScore(evaluation.finalScore)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{getRatingLabel(evaluation.finalScore)}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(evaluation.updatedAt)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={t.common.options}>
                        <IconDots className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(evaluation)}>
                        <IconEye className="ms-2 h-4 w-4" />{t.common.viewDetails}</DropdownMenuItem>
                      {canReviewEvaluation(evaluation) && (
                        <DropdownMenuItem onClick={() => onReview(evaluation)}>
                          <IconClipboardCheck className="ms-2 h-4 w-4" />
                          {t.evaluations.pReviewEvaluation}
                        </DropdownMenuItem>
                      )}
                      {canAcknowledgeEvaluation(evaluation) && (
                        <DropdownMenuItem onClick={() => onAcknowledge(evaluation.id)}>
                          <IconCheck className="ms-2 h-4 w-4" />
                          {t.evaluations.pConfirmAcknowledgment}
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
    </Card>
  );
}
