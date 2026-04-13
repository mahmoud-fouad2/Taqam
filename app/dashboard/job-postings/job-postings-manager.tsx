"use client";

import * as React from "react";
import {
  IconBriefcase,
  IconCurrencyDollar,
  IconEdit,
  IconEye,
  IconFilter,
  IconMapPin,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUsers
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TableEmptyRow } from "@/components/empty-states/table-empty-row";
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
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { departmentsService } from "@/lib/api/departments";
import {
  createJobPosting,
  deleteJobPosting,
  getJobPostings,
  updateJobPosting
} from "@/lib/api/recruitment";
import type { Department } from "@/lib/types/core-hr";
import {
  type ExperienceLevel,
  experienceLevelLabels,
  type JobPosting,
  type JobStatus,
  jobStatusColors,
  jobStatusLabels,
  type JobType,
  jobTypeLabels
} from "@/lib/types/recruitment";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

type JobFormState = {
  title: string;
  titleAr: string;
  description: string;
  departmentId: string;
  location: string;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  salaryMin: string;
  salaryMax: string;
  openPositions: string;
  requirements: string;
  benefits: string;
  applicationDeadline: string;
};

const emptyJobForm: JobFormState = {
  title: "",
  titleAr: "",
  description: "",
  departmentId: "",
  location: "",
  jobType: "full-time",
  experienceLevel: "mid",
  salaryMin: "",
  salaryMax: "",
  openPositions: "1",
  requirements: "",
  benefits: "",
  applicationDeadline: ""
};

function linesToText(lines?: string[]) {
  return (lines ?? []).join("\n");
}

function buildJobForm(job: JobPosting): JobFormState {
  return {
    title: job.title,
    titleAr: job.titleEn ?? "",
    description: job.description,
    departmentId: job.departmentId,
    location: job.location,
    jobType: job.jobType,
    experienceLevel: job.experienceLevel,
    salaryMin: job.salaryMin?.toString() ?? "",
    salaryMax: job.salaryMax?.toString() ?? "",
    openPositions: job.openPositions.toString(),
    requirements: linesToText(job.requirements),
    benefits: linesToText(job.benefits),
    applicationDeadline: job.applicationDeadline?.slice(0, 10) ?? ""
  };
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function JobPostingsManager() {
  const locale = useClientLocale("ar");
  const t = getText(locale);
  const numLocale = locale === "en" ? "en-US" : "ar-SA";
  const [jobs, setJobs] = React.useState<JobPosting[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [selectedJob, setSelectedJob] = React.useState<JobPosting | null>(null);
  const [editingJob, setEditingJob] = React.useState<JobPosting | null>(null);
  const [jobForm, setJobForm] = React.useState<JobFormState>(emptyJobForm);
  const [isFormSheetOpen, setIsFormSheetOpen] = React.useState(false);
  const [isViewSheetOpen, setIsViewSheetOpen] = React.useState(false);
  const [deleteJobId, setDeleteJobId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [jobsRes, departmentsRes] = await Promise.all([
        getJobPostings(),
        departmentsService.getAll()
      ]);

      setJobs(jobsRes);
      setDepartments(departmentsRes.data ?? []);

      if (!departmentsRes.success) {
        toast.error(departmentsRes.error || t.jobPostings.fetchDeptsFailed);
      }
    } catch (error) {
      setJobs([]);
      setDepartments([]);
      toast.error(error instanceof Error ? error.message : t.jobPostings.fetchFailed);
    } finally {
      setIsLoading(false);
    }
  }, [t.jobPostings.fetchDeptsFailed, t.jobPostings.fetchFailed]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredJobs = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesQuery =
        !query ||
        job.title.toLowerCase().includes(query) ||
        (job.titleEn || "").toLowerCase().includes(query) ||
        job.departmentName.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query);

      const matchesStatus = statusFilter === "all" || job.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [jobs, searchQuery, statusFilter]);

  const stats = React.useMemo(
    () => ({
      total: jobs.length,
      active: jobs.filter((job) => job.status === "active").length,
      filled: jobs.filter((job) => job.status === "filled").length,
      totalPositions: jobs.reduce((sum, job) => sum + job.openPositions, 0)
    }),
    [jobs]
  );

  function updateFormValue<K extends keyof JobFormState>(key: K, value: JobFormState[K]) {
    setJobForm((current) => ({ ...current, [key]: value }));
  }

  function openCreateSheet() {
    setEditingJob(null);
    setJobForm(emptyJobForm);
    setIsFormSheetOpen(true);
  }

  function openEditSheet(job: JobPosting) {
    setEditingJob(job);
    setJobForm(buildJobForm(job));
    setIsFormSheetOpen(true);
  }

  async function saveJob(targetStatus: JobStatus) {
    const title = jobForm.title.trim();
    const description = jobForm.description.trim();
    const openPositions = Math.max(1, Number(jobForm.openPositions || 1));
    const salaryMin = jobForm.salaryMin ? Number(jobForm.salaryMin) : undefined;
    const salaryMax = jobForm.salaryMax ? Number(jobForm.salaryMax) : undefined;

    if (title.length < 2) {
      toast.error(t.jobPostings.enterValidTitle);
      return;
    }

    if (description.length < 5) {
      toast.error(t.jobPostings.enterClearerDesc);
      return;
    }

    if (salaryMin !== undefined && salaryMax !== undefined && salaryMin > salaryMax) {
      toast.error(t.jobPostings.minSalaryError);
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<JobPosting> = {
        title,
        titleEn: jobForm.titleAr.trim() || undefined,
        description,
        departmentId: jobForm.departmentId || undefined,
        location: jobForm.location.trim() || t.common.unspecified,
        jobType: jobForm.jobType,
        experienceLevel: jobForm.experienceLevel,
        salaryMin,
        salaryMax,
        openPositions,
        requirements: splitLines(jobForm.requirements),
        benefits: splitLines(jobForm.benefits),
        applicationDeadline: jobForm.applicationDeadline || undefined,
        status: targetStatus,
        postedDate:
          targetStatus === "active"
            ? editingJob?.postedDate || new Date().toISOString()
            : editingJob?.postedDate
      };

      const savedJob = editingJob
        ? await updateJobPosting(editingJob.id, payload)
        : await createJobPosting(payload);

      setJobs((current) => {
        if (editingJob) {
          return current.map((job) => (job.id === savedJob.id ? savedJob : job));
        }

        return [savedJob, ...current];
      });

      if (selectedJob?.id === savedJob.id) {
        setSelectedJob(savedJob);
      }

      toast.success(editingJob ? t.jobPostings.jobUpdated : t.jobPostings.jobCreated);
      setIsFormSheetOpen(false);
      setEditingJob(null);
      setJobForm(emptyJobForm);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.jobPostings.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDeleteJob() {
    if (!deleteJobId) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteJobPosting(deleteJobId);
      setJobs((current) => current.filter((job) => job.id !== deleteJobId));

      if (selectedJob?.id === deleteJobId) {
        setSelectedJob(null);
        setIsViewSheetOpen(false);
      }

      toast.success(t.jobPostings.deletedSuccess);
      setDeleteJobId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.jobPostings.deleteFailed);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.jobPostings.totalJobs}</CardTitle>
            <IconBriefcase className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-muted-foreground text-xs">{t.jobPostings.announcedJobs}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.jobPostings.openPositions}</CardTitle>
            <IconUsers className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-muted-foreground text-xs">{t.jobPostings.acceptingApplications}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.jobPostings.filled}</CardTitle>
            <IconBriefcase className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.filled}</div>
            <p className="text-muted-foreground text-xs">{t.jobPostings.completedRecruitment}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.jobPostings.vacantPositions}</CardTitle>
            <IconUsers className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.totalPositions}</div>
            <p className="text-muted-foreground text-xs">{t.jobPostings.positionRequired}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t.jobPostings.pageTitle}</CardTitle>
              <CardDescription>{t.jobPostings.pageSubtitle}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void loadData()} disabled={isLoading}>
                {t.jobPostings.pReload}
              </Button>
              <Button onClick={openCreateSheet}>
                <IconPlus className="ms-2 h-4 w-4" />
                {t.jobPostings.pAddJob}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <IconSearch className="text-muted-foreground absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder={t.jobPostings.searchPlaceholder}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
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
                {Object.entries(jobStatusLabels).map(([value, label]) => (
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
                  <TableHead>{t.onboarding.jobCol}</TableHead>
                  <TableHead>{t.common.department}</TableHead>
                  <TableHead>{t.jobPostings.locationCol}</TableHead>
                  <TableHead>{t.common.type}</TableHead>
                  <TableHead>{t.jobPostings.positions}</TableHead>
                  <TableHead>{t.common.status}</TableHead>
                  <TableHead>{t.jobPostings.publishDate}</TableHead>
                  <TableHead className="text-start">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                      {t.common.loading}
                    </TableCell>
                  </TableRow>
                ) : filteredJobs.length === 0 ? (
                  <TableEmptyRow
                    colSpan={8}
                    title={t.jobPostings.noMatchingJobs}
                    icon={<IconBriefcase className="size-5" />}
                  />
                ) : (
                  filteredJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{job.title}</p>
                          {job.titleEn && (
                            <p className="text-muted-foreground text-xs">{job.titleEn}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{job.departmentName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <IconMapPin className="text-muted-foreground h-3 w-3" />
                          {job.location}
                        </div>
                      </TableCell>
                      <TableCell>{jobTypeLabels[job.jobType]}</TableCell>
                      <TableCell>
                        <span className="font-medium">{job.filledPositions}</span>
                        <span className="text-muted-foreground">/{job.openPositions}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={jobStatusColors[job.status]}>
                          {jobStatusLabels[job.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(job.postedDate).toLocaleDateString(
                          locale === "ar" ? "ar-SA" : "en-US"
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              •••
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedJob(job);
                                setIsViewSheetOpen(true);
                              }}>
                              <IconEye className="ms-2 h-4 w-4" />
                              {t.common.viewDetails}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditSheet(job)}>
                              <IconEdit className="ms-2 h-4 w-4" />
                              {t.common.edit}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteJobId(job.id)}>
                              <IconTrash className="ms-2 h-4 w-4" />
                              {t.common.delete}
                            </DropdownMenuItem>
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

      <Sheet open={isFormSheetOpen} onOpenChange={setIsFormSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editingJob ? t.jobPostings.editJob : t.jobPostings.addNewJob}</SheetTitle>
            <SheetDescription>{t.jobPostings.formDesc}</SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="job-title">{t.common.jobTitle}</Label>
              <Input
                id="job-title"
                value={jobForm.title}
                onChange={(event) => updateFormValue("title", event.target.value)}
                placeholder={t.jobPostings.titlePlaceholder}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="job-title-ar">{t.jobPostings.titleAr}</Label>
              <Input
                id="job-title-ar"
                value={jobForm.titleAr}
                onChange={(event) => updateFormValue("titleAr", event.target.value)}
                placeholder={t.jobPostings.titleArExample}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>{t.common.department}</Label>
                <Select
                  value={jobForm.departmentId || "none"}
                  onValueChange={(value) =>
                    updateFormValue("departmentId", value === "none" ? "" : value)
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder={t.jobPostings.chooseDept} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.jobPostings.noDept}</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.nameAr || department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="job-location">{t.jobPostings.locationCol}</Label>
                <Input
                  id="job-location"
                  value={jobForm.location}
                  onChange={(event) => updateFormValue("location", event.target.value)}
                  placeholder={t.jobPostings.riyadh}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>{t.jobPostings.jobType}</Label>
                <Select
                  value={jobForm.jobType}
                  onValueChange={(value) => updateFormValue("jobType", value as JobType)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.common.selectType} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(jobTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>{t.jobPostings.experienceLevel}</Label>
                <Select
                  value={jobForm.experienceLevel}
                  onValueChange={(value) =>
                    updateFormValue("experienceLevel", value as ExperienceLevel)
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder={t.common.selectLevel} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(experienceLevelLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="salary-min">{t.jobPostings.minSalary}</Label>
                <Input
                  id="salary-min"
                  type="number"
                  value={jobForm.salaryMin}
                  onChange={(event) => updateFormValue("salaryMin", event.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="salary-max">{t.jobPostings.maxSalary}</Label>
                <Input
                  id="salary-max"
                  type="number"
                  value={jobForm.salaryMax}
                  onChange={(event) => updateFormValue("salaryMax", event.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="open-positions">{t.jobPostings.positionsCount}</Label>
                <Input
                  id="open-positions"
                  type="number"
                  min={1}
                  value={jobForm.openPositions}
                  onChange={(event) => updateFormValue("openPositions", event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="deadline">{t.jobPostings.closingDate}</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={jobForm.applicationDeadline}
                  onChange={(event) => updateFormValue("applicationDeadline", event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="job-description">{t.jobPostings.jobDescription}</Label>
              <Textarea
                id="job-description"
                value={jobForm.description}
                onChange={(event) => updateFormValue("description", event.target.value)}
                placeholder={t.jobPostings.jobDescPlaceholder}
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="job-requirements">{t.jobPostings.requirements}</Label>
              <Textarea
                id="job-requirements"
                value={jobForm.requirements}
                onChange={(event) => updateFormValue("requirements", event.target.value)}
                placeholder={t.jobPostings.requirementsPlaceholder}
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="job-benefits">{t.jobPostings.benefits}</Label>
              <Textarea
                id="job-benefits"
                value={jobForm.benefits}
                onChange={(event) => updateFormValue("benefits", event.target.value)}
                placeholder={t.jobPostings.benefitsPlaceholder}
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-2 pt-4 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => void saveJob("draft")}
                disabled={isSaving}>
                {isSaving ? t.common.saving : t.jobPostings.saveAsDraft}
              </Button>
              <Button className="flex-1" onClick={() => void saveJob("active")} disabled={isSaving}>
                {isSaving
                  ? t.jobPostings.publishing
                  : editingJob
                    ? t.jobPostings.updateAndPublish
                    : t.jobPostings.publishJob}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{selectedJob?.title}</SheetTitle>
            <SheetDescription>{selectedJob?.titleEn || t.jobPostings.jobDetails}</SheetDescription>
          </SheetHeader>

          {selectedJob && (
            <div className="space-y-6 py-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={jobStatusColors[selectedJob.status]}>
                  {jobStatusLabels[selectedJob.status]}
                </Badge>
                <Badge variant="outline">{jobTypeLabels[selectedJob.jobType]}</Badge>
                <Badge variant="outline">
                  {experienceLevelLabels[selectedJob.experienceLevel]}
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="bg-muted/20 flex items-center gap-2 rounded-lg border p-3 text-sm">
                  <IconBriefcase className="text-muted-foreground h-4 w-4" />
                  <span>{selectedJob.departmentName}</span>
                </div>
                <div className="bg-muted/20 flex items-center gap-2 rounded-lg border p-3 text-sm">
                  <IconMapPin className="text-muted-foreground h-4 w-4" />
                  <span>{selectedJob.location}</span>
                </div>
                {selectedJob.showSalary ? (
                  <div className="bg-muted/20 flex items-center gap-2 rounded-lg border p-3 text-sm">
                    <IconCurrencyDollar className="text-muted-foreground h-4 w-4" />
                    <span>
                      {selectedJob.salaryMin?.toLocaleString(numLocale) || "0"} -{" "}
                      {selectedJob.salaryMax?.toLocaleString(numLocale) || "0"}{" "}
                      {selectedJob.currency}
                    </span>
                  </div>
                ) : null}
                <div className="bg-muted/20 flex items-center gap-2 rounded-lg border p-3 text-sm">
                  <IconUsers className="text-muted-foreground h-4 w-4" />
                  <span>
                    {selectedJob.openPositions} {t.jobPostings.requiredPositions}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">{t.common.description}</h4>
                <p className="text-muted-foreground text-sm">{selectedJob.description}</p>
              </div>

              {selectedJob.requirements.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold">{t.jobPostings.requirements}</h4>
                  <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                    {selectedJob.requirements.map((requirement) => (
                      <li key={requirement}>{requirement}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedJob.benefits.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold">{t.jobPostings.benefits}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.benefits.map((benefit) => (
                      <Badge key={benefit} variant="outline">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob.applicationDeadline && (
                <div>
                  <h4 className="mb-2 font-semibold">{t.jobPostings.applicationDeadline}</h4>
                  <p className="text-muted-foreground text-sm">
                    {new Date(selectedJob.applicationDeadline).toLocaleDateString(
                      locale === "ar" ? "ar-SA" : "en-US"
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={deleteJobId !== null}
        onOpenChange={(open) => !open && setDeleteJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.jobPostings.deleteJob}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.jobPostings.pAreYouSureYouWantToDelete}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDeleteJob()}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? t.common.deleting : t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
