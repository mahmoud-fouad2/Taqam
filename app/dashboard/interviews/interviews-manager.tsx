"use client";

import * as React from "react";
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconCalendar,
  IconClock,
  IconMapPin,
  IconVideo,
  IconPhone,
  IconUsers,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
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
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useEmployees } from "@/hooks/use-employees";
import {
  Applicant,
  Interview,
  InterviewFeedback,
  InterviewType,
  InterviewStatus,
  interviewTypeLabels,
  interviewStatusLabels,
  interviewStatusColors,
  recommendationLabels,
} from "@/lib/types/recruitment";
import {
  getApplicants,
  getInterviews,
  scheduleInterview,
  submitInterviewFeedback,
  updateInterviewStatus,
} from "@/lib/api/recruitment";

type ScheduleFormState = {
  applicantId: string;
  type: InterviewType;
  scheduledDate: string;
  scheduledTime: string;
  duration: string;
  location: string;
  meetingLink: string;
  interviewerId: string;
};

type FeedbackFormState = {
  rating: number;
  strengths: string;
  weaknesses: string;
  recommendation: InterviewFeedback["recommendation"];
  comments: string;
};

const INITIAL_SCHEDULE_FORM: ScheduleFormState = {
  applicantId: "",
  type: "hr",
  scheduledDate: "",
  scheduledTime: "",
  duration: "60",
  location: "",
  meetingLink: "",
  interviewerId: "",
};

const INITIAL_FEEDBACK_FORM: FeedbackFormState = {
  rating: 4,
  strengths: "",
  weaknesses: "",
  recommendation: "hire",
  comments: "",
};

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(date: string) {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("ar-SA");
}

export function InterviewsManager() {
  const { employees } = useEmployees();
  const [interviews, setInterviews] = React.useState<Interview[]>([]);
  const [applicants, setApplicants] = React.useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [isAddSheetOpen, setIsAddSheetOpen] = React.useState(false);
  const [scheduleForm, setScheduleForm] = React.useState<ScheduleFormState>(INITIAL_SCHEDULE_FORM);
  const [isSubmittingSchedule, setIsSubmittingSchedule] = React.useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = React.useState<string | null>(null);
  const [feedbackInterview, setFeedbackInterview] = React.useState<Interview | null>(null);
  const [feedbackForm, setFeedbackForm] = React.useState<FeedbackFormState>(INITIAL_FEEDBACK_FORM);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = React.useState(false);

  const refreshData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [interviewsRes, applicantsRes] = await Promise.all([getInterviews(), getApplicants()]);
      setInterviews(interviewsRes);
      setApplicants(applicantsRes);
    } catch (error) {
      setInterviews([]);
      setApplicants([]);
      toast.error("فشل تحميل بيانات المقابلات");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const selectedApplicant = React.useMemo(
    () => applicants.find((applicant) => applicant.id === scheduleForm.applicantId) ?? null,
    [applicants, scheduleForm.applicantId]
  );

  const filteredInterviews = React.useMemo(() => {
    return interviews.filter((interview) => {
      const matchesSearch =
        interview.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        interview.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || interview.status === statusFilter;

      const matchesType =
        typeFilter === "all" || interview.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [interviews, searchQuery, statusFilter, typeFilter]);

  const stats = React.useMemo(() => ({
    total: interviews.length,
    scheduled: interviews.filter((i) => i.status === "scheduled").length,
    completed: interviews.filter((i) => i.status === "completed").length,
    today: interviews.filter((i) => {
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      return i.scheduledDate === todayKey;
    }).length,
  }), [interviews]);

  const handleScheduleSubmit = async () => {
    if (!selectedApplicant || !scheduleForm.scheduledDate || !scheduleForm.scheduledTime) {
      toast.error("الرجاء استكمال بيانات المقابلة المطلوبة");
      return;
    }

    setIsSubmittingSchedule(true);
    try {
      const interviewer = employees.find((employee) => employee.id === scheduleForm.interviewerId);
      const created = await scheduleInterview({
        applicantId: selectedApplicant.id,
        jobPostingId: selectedApplicant.jobPostingId,
        type: scheduleForm.type,
        status: "scheduled",
        scheduledDate: scheduleForm.scheduledDate,
        scheduledTime: scheduleForm.scheduledTime,
        duration: Number(scheduleForm.duration || 60),
        location: scheduleForm.location || undefined,
        meetingLink: scheduleForm.meetingLink || undefined,
        interviewers: interviewer
          ? [
              {
                id: interviewer.id,
                name: `${interviewer.firstName} ${interviewer.lastName}`.trim(),
                role: interviewer.jobTitleId ? interviewer.jobTitleId : "Interviewer",
              },
            ]
          : [],
      });

      setInterviews((current) => [created, ...current]);
      setScheduleForm(INITIAL_SCHEDULE_FORM);
      setIsAddSheetOpen(false);
      toast.success("تمت جدولة المقابلة بنجاح");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر جدولة المقابلة");
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const handleStatusChange = async (interviewId: string, newStatus: InterviewStatus) => {
    setStatusUpdatingId(interviewId);
    try {
      const updated = await updateInterviewStatus(interviewId, newStatus);
      setInterviews((current) => current.map((item) => (item.id === interviewId ? updated : item)));
      toast.success("تم تحديث حالة المقابلة");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحديث حالة المقابلة");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const openFeedbackDialog = (interview: Interview) => {
    const existingFeedback = interview.feedback?.[0];
    setFeedbackInterview(interview);
    setFeedbackForm({
      rating: existingFeedback?.overallRating ?? INITIAL_FEEDBACK_FORM.rating,
      strengths: existingFeedback?.strengths?.join("\n") ?? "",
      weaknesses: existingFeedback?.weaknesses?.join("\n") ?? "",
      recommendation: existingFeedback?.recommendation ?? INITIAL_FEEDBACK_FORM.recommendation,
      comments: existingFeedback?.comments ?? "",
    });
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackInterview) return;
    if (feedbackForm.rating < 1 || feedbackForm.rating > 5) {
      toast.error("درجة التقييم يجب أن تكون بين 1 و 5");
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const primaryInterviewer = feedbackInterview.interviewers[0];
      const updated = await submitInterviewFeedback(feedbackInterview.id, [
        {
          interviewerId: primaryInterviewer?.id || "unknown",
          interviewerName: primaryInterviewer?.name || "غير محدد",
          overallRating: feedbackForm.rating,
          strengths: splitLines(feedbackForm.strengths),
          weaknesses: splitLines(feedbackForm.weaknesses),
          recommendation: feedbackForm.recommendation,
          comments: feedbackForm.comments || undefined,
          submittedAt: new Date().toISOString(),
        },
      ]);

      setInterviews((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setFeedbackInterview(null);
      setFeedbackForm(INITIAL_FEEDBACK_FORM);
      toast.success("تم حفظ تقييم المقابلة");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ تقييم المقابلة");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const getInterviewTypeIcon = (type: InterviewType) => {
    switch (type) {
      case "phone":
        return <IconPhone className="h-4 w-4" />;
      case "video":
        return <IconVideo className="h-4 w-4" />;
      case "in-person":
        return <IconMapPin className="h-4 w-4" />;
      case "technical":
      case "hr":
      case "final":
        return <IconUsers className="h-4 w-4" />;
      default:
        return <IconCalendar className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* بطاقات الإحصائيات */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المقابلات</CardTitle>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">مقابلة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مقابلات اليوم</CardTitle>
            <IconClock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.today}</div>
            <p className="text-xs text-muted-foreground">مقابلة مجدولة اليوم</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مقابلات قادمة</CardTitle>
            <IconCalendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
            <p className="text-xs text-muted-foreground">بانتظار الموعد</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مكتملة</CardTitle>
            <IconCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">مقابلة مكتملة</p>
          </CardContent>
        </Card>
      </div>

      {/* جدول المقابلات */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>المقابلات</CardTitle>
              <CardDescription>جدولة وإدارة المقابلات مع المرشحين</CardDescription>
            </div>
            <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
              <SheetTrigger asChild>
                <Button>
                  <IconPlus className="ms-2 h-4 w-4" />
                  جدولة مقابلة
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>جدولة مقابلة جديدة</SheetTitle>
                  <SheetDescription>
                    أدخل تفاصيل المقابلة مع المرشح
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="applicant">المتقدم</Label>
                    <Select
                      value={scheduleForm.applicantId}
                      onValueChange={(value) => setScheduleForm((current) => ({ ...current, applicantId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المتقدم" />
                      </SelectTrigger>
                      <SelectContent>
                        {applicants.map((applicant) => (
                          <SelectItem key={applicant.id} value={applicant.id}>
                            {applicant.firstName} {applicant.lastName} - {applicant.jobTitle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">نوع المقابلة</Label>
                    <Select
                      value={scheduleForm.type}
                      onValueChange={(value: InterviewType) => setScheduleForm((current) => ({ ...current, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(interviewTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="date">التاريخ</Label>
                      <Input
                        id="date"
                        type="date"
                        value={scheduleForm.scheduledDate}
                        onChange={(event) =>
                          setScheduleForm((current) => ({ ...current, scheduledDate: event.target.value }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="time">الوقت</Label>
                      <Input
                        id="time"
                        type="time"
                        value={scheduleForm.scheduledTime}
                        onChange={(event) =>
                          setScheduleForm((current) => ({ ...current, scheduledTime: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="duration">المدة (بالدقائق)</Label>
                    <Select
                      value={scheduleForm.duration}
                      onValueChange={(value) => setScheduleForm((current) => ({ ...current, duration: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 دقيقة</SelectItem>
                        <SelectItem value="45">45 دقيقة</SelectItem>
                        <SelectItem value="60">ساعة</SelectItem>
                        <SelectItem value="90">ساعة ونصف</SelectItem>
                        <SelectItem value="120">ساعتان</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">المكان / رابط الاجتماع</Label>
                    <Input
                      id="location"
                      placeholder="غرفة الاجتماعات"
                      value={scheduleForm.location}
                      onChange={(event) =>
                        setScheduleForm((current) => ({ ...current, location: event.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="meeting-link">رابط الاجتماع</Label>
                    <Input
                      id="meeting-link"
                      placeholder="https://meet.google.com/..."
                      dir="ltr"
                      value={scheduleForm.meetingLink}
                      onChange={(event) =>
                        setScheduleForm((current) => ({ ...current, meetingLink: event.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="interviewers">المُقابِلون</Label>
                    <Select
                      value={scheduleForm.interviewerId}
                      onValueChange={(value) => setScheduleForm((current) => ({ ...current, interviewerId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المُقابِلين" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.firstName} {employee.lastName} - {employee.employeeNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedApplicant && (
                    <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                      سيتم ربط المقابلة بوظيفة: <span className="font-medium text-foreground">{selectedApplicant.jobTitle}</span>
                    </div>
                  )}
                  <Button className="mt-4" onClick={handleScheduleSubmit} disabled={isSubmittingSchedule}>
                    جدولة المقابلة
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {Object.entries(interviewTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
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
                {Object.entries(interviewStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* جدول المقابلات */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المرشح</TableHead>
                  <TableHead>الوظيفة</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>التاريخ والوقت</TableHead>
                  <TableHead>المُقابِلون</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-start">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      جاري تحميل المقابلات...
                    </TableCell>
                  </TableRow>
                ) : filteredInterviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">لا توجد مقابلات</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInterviews.map((interview) => (
                    <TableRow key={interview.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {interview.applicantName.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{interview.applicantName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{interview.jobTitle}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getInterviewTypeIcon(interview.type)}
                          <span>{interviewTypeLabels[interview.type]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{new Date(interview.scheduledDate).toLocaleDateString("ar-SA")}</p>
                          <p className="text-xs text-muted-foreground">
                            {interview.scheduledTime} ({interview.duration} دقيقة)
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {interview.interviewers.length > 0 ? (
                          <div className="flex -space-x-2 space-x-reverse">
                            {interview.interviewers.slice(0, 3).map((interviewer) => (
                              <Avatar key={interviewer.id} className="h-7 w-7 border-2 border-background">
                                <AvatarImage src={interviewer.avatar} alt="" />
                                <AvatarFallback className="text-xs">
                                  {interviewer.name
                                    .split(" ")
                                    .map((part) => part[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">غير محدد</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={interviewStatusColors[interview.status]}>
                          {interviewStatusLabels[interview.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={statusUpdatingId === interview.id}>
                              •••
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {interview.status === "scheduled" && (
                              <>
                                <DropdownMenuItem onClick={() => openFeedbackDialog(interview)}>
                                  <IconCheck className="ms-2 h-4 w-4" />
                                  تسجيل تقييم المقابلة
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(interview.id, "completed")}>
                                  <IconClock className="ms-2 h-4 w-4" />
                                  إنهاء بدون تقييم
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(interview.id, "no-show")}>
                                  <IconX className="ms-2 h-4 w-4" />
                                  لم يحضر
                                </DropdownMenuItem>
                              </>
                            )}
                            {interview.status === "completed" && (
                              <DropdownMenuItem onClick={() => openFeedbackDialog(interview)}>
                                <IconCheck className="ms-2 h-4 w-4" />
                                {interview.feedback?.length ? "تعديل التقييم" : "إضافة تقييم"}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleStatusChange(interview.id, "cancelled")}
                              disabled={interview.status === "cancelled"}
                            >
                              <IconX className="ms-2 h-4 w-4" />
                              إلغاء المقابلة
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

      <Dialog open={Boolean(feedbackInterview)} onOpenChange={(open) => !open && setFeedbackInterview(null)}>
        <DialogContent className="w-full sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>تقييم المقابلة</DialogTitle>
            <DialogDescription>
              {feedbackInterview
                ? `تسجيل تقييم ${feedbackInterview.applicantName} لوظيفة ${feedbackInterview.jobTitle}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="rating">التقييم العام</Label>
              <Input
                id="rating"
                type="number"
                min={1}
                max={5}
                step={1}
                value={feedbackForm.rating}
                onChange={(event) =>
                  setFeedbackForm((current) => ({
                    ...current,
                    rating: Number(event.target.value || current.rating),
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="recommendation">التوصية</Label>
              <Select
                value={feedbackForm.recommendation}
                onValueChange={(value: InterviewFeedback["recommendation"]) =>
                  setFeedbackForm((current) => ({ ...current, recommendation: value }))
                }
              >
                <SelectTrigger id="recommendation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(recommendationLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="strengths">نقاط القوة</Label>
                <Textarea
                  id="strengths"
                  rows={4}
                  placeholder="سطر لكل نقطة"
                  value={feedbackForm.strengths}
                  onChange={(event) =>
                    setFeedbackForm((current) => ({ ...current, strengths: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="weaknesses">نقاط التحسين</Label>
                <Textarea
                  id="weaknesses"
                  rows={4}
                  placeholder="سطر لكل نقطة"
                  value={feedbackForm.weaknesses}
                  onChange={(event) =>
                    setFeedbackForm((current) => ({ ...current, weaknesses: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="comments">ملاحظات إضافية</Label>
              <Textarea
                id="comments"
                rows={3}
                value={feedbackForm.comments}
                onChange={(event) =>
                  setFeedbackForm((current) => ({ ...current, comments: event.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackInterview(null)}>
              إلغاء
            </Button>
            <Button onClick={handleFeedbackSubmit} disabled={isSubmittingFeedback}>
              حفظ التقييم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
