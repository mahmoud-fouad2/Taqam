"use client";

import * as React from "react";
import {
  IconBriefcase,
  IconCalendar,
  IconExternalLink,
  IconEye,
  IconFileText,
  IconFilter,
  IconMail,
  IconPhone,
  IconSearch,
  IconStar,
  IconStarFilled,
  IconUser,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/sheet";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  getApplicant,
  getApplicants,
  getJobPostings,
  updateApplicantRating,
  updateApplicantStatus,
} from "@/lib/api/recruitment";
import {
  type Applicant,
  applicationStatusColors,
  applicationStatusLabels,
  type ApplicationStatus,
  type JobPosting,
  sourceChannelLabels,
} from "@/lib/types/recruitment";

export function ApplicantsManager() {
  const [applicants, setApplicants] = React.useState<Applicant[]>([]);
  const [jobs, setJobs] = React.useState<JobPosting[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [jobFilter, setJobFilter] = React.useState<string>("all");
  const [selectedApplicant, setSelectedApplicant] = React.useState<Applicant | null>(null);
  const [isViewSheetOpen, setIsViewSheetOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [updatingStatusId, setUpdatingStatusId] = React.useState<string | null>(null);
  const [updatingRatingId, setUpdatingRatingId] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [applicantsRes, jobsRes] = await Promise.all([getApplicants(), getJobPostings()]);
      setApplicants(applicantsRes);
      setJobs(jobsRes);
    } catch (error) {
      setApplicants([]);
      setJobs([]);
      toast.error(error instanceof Error ? error.message : "فشل في جلب بيانات التوظيف");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredApplicants = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return applicants.filter((applicant) => {
      const matchesQuery =
        !query ||
        `${applicant.firstName} ${applicant.lastName}`.toLowerCase().includes(query) ||
        applicant.email.toLowerCase().includes(query) ||
        applicant.jobTitle.toLowerCase().includes(query);

      const matchesStatus = statusFilter === "all" || applicant.status === statusFilter;
      const matchesJob = jobFilter === "all" || applicant.jobPostingId === jobFilter;

      return matchesQuery && matchesStatus && matchesJob;
    });
  }, [applicants, searchQuery, statusFilter, jobFilter]);

  const stats = React.useMemo(
    () => ({
      total: applicants.length,
      new: applicants.filter((applicant) => applicant.status === "new").length,
      interview: applicants.filter((applicant) => applicant.status === "interview").length,
      accepted: applicants.filter((applicant) => applicant.status === "accepted").length,
    }),
    [applicants]
  );

  async function handleViewApplicant(applicant: Applicant) {
    setSelectedApplicant(applicant);
    setIsViewSheetOpen(true);

    try {
      const freshApplicant = await getApplicant(applicant.id);
      if (!freshApplicant) {
        return;
      }

      setApplicants((current) =>
        current.map((item) => (item.id === freshApplicant.id ? freshApplicant : item))
      );
      setSelectedApplicant(freshApplicant);
    } catch {
      // Keep the already selected applicant if the refresh fails.
    }
  }

  async function handleStatusChange(applicantId: string, newStatus: ApplicationStatus) {
    setUpdatingStatusId(applicantId);
    try {
      const updatedApplicant = await updateApplicantStatus(applicantId, newStatus);
      setApplicants((current) =>
        current.map((applicant) => (applicant.id === updatedApplicant.id ? updatedApplicant : applicant))
      );

      if (selectedApplicant?.id === updatedApplicant.id) {
        setSelectedApplicant(updatedApplicant);
      }

      toast.success("تم تحديث حالة المتقدم");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل في تحديث حالة المتقدم");
    } finally {
      setUpdatingStatusId(null);
    }
  }

  async function handleRatingChange(applicantId: string, rating: number) {
    setUpdatingRatingId(applicantId);
    try {
      const updatedApplicant = await updateApplicantRating(applicantId, rating);
      setApplicants((current) =>
        current.map((applicant) => (applicant.id === updatedApplicant.id ? updatedApplicant : applicant))
      );

      if (selectedApplicant?.id === updatedApplicant.id) {
        setSelectedApplicant(updatedApplicant);
      }

      toast.success("تم تحديث تقييم المتقدم");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل في تحديث تقييم المتقدم");
    } finally {
      setUpdatingRatingId(null);
    }
  }

  function renderStars(rating: number | undefined, applicantId: string) {
    const isUpdating = updatingRatingId === applicantId;

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={isUpdating}
            onClick={() => void handleRatingChange(applicantId, star)}
            className="text-yellow-500 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {rating && star <= rating ? <IconStarFilled className="h-4 w-4" /> : <IconStar className="h-4 w-4" />}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المتقدمين</CardTitle>
            <IconUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">متقدم</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">طلبات جديدة</CardTitle>
            <IconFileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
            <p className="text-xs text-muted-foreground">بانتظار المراجعة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">في المقابلات</CardTitle>
            <IconCalendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.interview}</div>
            <p className="text-xs text-muted-foreground">قيد التقييم</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">تم قبولهم</CardTitle>
            <IconBriefcase className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            <p className="text-xs text-muted-foreground">مرشحون مقبولون</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>المتقدمون للوظائف</CardTitle>
          <CardDescription>إدارة طلبات التقديم وتحديث الحالة والتقييم بشكل فعلي</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <IconSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث عن متقدم..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="ps-9"
              />
            </div>
            <Select value={jobFilter} onValueChange={setJobFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="الوظيفة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الوظائف</SelectItem>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <IconFilter className="ms-2 h-4 w-4" />
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {Object.entries(applicationStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المتقدم</TableHead>
                  <TableHead>الوظيفة</TableHead>
                  <TableHead>المصدر</TableHead>
                  <TableHead>التقييم</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ التقديم</TableHead>
                  <TableHead className="text-start">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isLoading && filteredApplicants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center">
                      <p className="text-muted-foreground">لا يوجد متقدمون مطابقون</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplicants.map((applicant) => (
                    <TableRow key={applicant.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>
                              {applicant.firstName[0]}
                              {applicant.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {applicant.firstName} {applicant.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{applicant.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{applicant.jobTitle}</p>
                          {applicant.currentCompany && (
                            <p className="text-xs text-muted-foreground">حالياً: {applicant.currentCompany}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sourceChannelLabels[applicant.source]}</Badge>
                      </TableCell>
                      <TableCell>{renderStars(applicant.rating, applicant.id)}</TableCell>
                      <TableCell>
                        <Select
                          value={applicant.status}
                          onValueChange={(value) => void handleStatusChange(applicant.id, value as ApplicationStatus)}
                          disabled={updatingStatusId === applicant.id}
                        >
                          <SelectTrigger className="h-8 w-36">
                            <Badge className={applicationStatusColors[applicant.status]}>
                              {applicationStatusLabels[applicant.status]}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(applicationStatusLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                <Badge className={applicationStatusColors[value as ApplicationStatus]}>{label}</Badge>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{new Date(applicant.appliedAt).toLocaleDateString("ar-SA")}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              •••
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => void handleViewApplicant(applicant)}>
                              <IconEye className="ms-2 h-4 w-4" />
                              عرض الملف
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={`mailto:${applicant.email}`}>
                                <IconMail className="ms-2 h-4 w-4" />
                                إرسال بريد
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => void handleStatusChange(applicant.id, "rejected")}>
                              رفض الطلب
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

      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>ملف المتقدم</SheetTitle>
            <SheetDescription>معلومات تفصيلية عن المتقدم ومسار طلبه</SheetDescription>
          </SheetHeader>

          {selectedApplicant && (
            <div className="space-y-6 py-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {selectedApplicant.firstName[0]}
                    {selectedApplicant.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    {selectedApplicant.firstName} {selectedApplicant.lastName}
                  </h3>
                  <p className="text-muted-foreground">{selectedApplicant.jobTitle}</p>
                  {selectedApplicant.currentCompany && (
                    <p className="text-sm text-muted-foreground">{selectedApplicant.currentCompany}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className={applicationStatusColors[selectedApplicant.status]}>
                      {applicationStatusLabels[selectedApplicant.status]}
                    </Badge>
                    {renderStars(selectedApplicant.rating, selectedApplicant.id)}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="mb-3 font-semibold">معلومات الاتصال</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <IconMail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${selectedApplicant.email}`} className="text-primary hover:underline">
                      {selectedApplicant.email}
                    </a>
                  </div>
                  {selectedApplicant.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <IconPhone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selectedApplicant.phone}`} className="hover:underline">
                        {selectedApplicant.phone}
                      </a>
                    </div>
                  )}
                  {selectedApplicant.linkedinUrl && (
                    <div className="flex items-center gap-2 text-sm">
                      <IconExternalLink className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={selectedApplicant.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        LinkedIn
                      </a>
                    </div>
                  )}
                  {selectedApplicant.resumeUrl && (
                    <div className="flex items-center gap-2 text-sm">
                      <IconFileText className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={selectedApplicant.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        فتح السيرة الذاتية
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="mb-3 font-semibold">تفاصيل التقديم</h4>
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="font-medium">{selectedApplicant.jobTitle}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-muted-foreground">
                    <span>المصدر: {sourceChannelLabels[selectedApplicant.source]}</span>
                    <span>تاريخ التقديم: {new Date(selectedApplicant.appliedAt).toLocaleDateString("ar-SA")}</span>
                  </div>
                </div>
              </div>

              {selectedApplicant.coverLetter && (
                <div>
                  <h4 className="mb-3 font-semibold">خطاب التقديم</h4>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{selectedApplicant.coverLetter}</p>
                </div>
              )}

              {selectedApplicant.notes && (
                <div>
                  <h4 className="mb-3 font-semibold">ملاحظات داخلية</h4>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{selectedApplicant.notes}</p>
                </div>
              )}

              {selectedApplicant.skills.length > 0 && (
                <div>
                  <h4 className="mb-3 font-semibold">المهارات</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplicant.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={() => void handleStatusChange(selectedApplicant.id, "interview")}>
                  <IconCalendar className="ms-2 h-4 w-4" />
                  نقل إلى المقابلة
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <a href={`mailto:${selectedApplicant.email}`}>
                    <IconMail className="ms-2 h-4 w-4" />
                    إرسال رسالة
                  </a>
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}