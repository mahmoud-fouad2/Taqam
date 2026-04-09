"use client";

import * as React from "react";
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconEye,
  IconEdit,
  IconTrash,
  IconBook,
  IconUsers,
  IconClock,
  IconCalendar,
  IconCertificate,
  IconStar,
  IconStarFilled,
  IconMapPin,
  IconVideo,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  TrainingCourse,
  CourseStatus,
  CourseType,
  CourseCategory,
  courseStatusLabels,
  courseStatusColors,
  courseTypeLabels,
  courseCategoryLabels,
} from "@/lib/types/training";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function TrainingCoursesManager() {
  const locale = useClientLocale("ar");
  const numLocale = locale === "en" ? "en-US" : "ar-SA";
  const [courses, setCourses] = React.useState<TrainingCourse[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [deleteCourseId, setDeleteCourseId] = React.useState<string | null>(null);
  const [isDeletingCourse, setIsDeletingCourse] = React.useState(false);
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [isAddSheetOpen, setIsAddSheetOpen] = React.useState(false);
  const [selectedCourse, setSelectedCourse] = React.useState<TrainingCourse | null>(null);
  const [isViewSheetOpen, setIsViewSheetOpen] = React.useState(false);

  const [stats, setStats] = React.useState<{
    totalCourses: number;
    activeCourses: number;
    totalEnrollments: number;
    completedEnrollments: number;
    totalHoursCompleted: number;
    certificationRate: number;
    budgetUsed: number;
    budgetTotal: number;
  } | null>(null);

  const defaultForm = React.useMemo(
    () => ({
      title: "",
      titleEn: "",
      category: "other" as CourseCategory,
      type: "in-person" as CourseType,
      duration: 1,
      maxParticipants: "",
      startDate: "",
      endDate: "",
      instructorName: "",
      locationOrLink: "",
      description: "",
      objectivesText: "",
    }),
    []
  );

  const [form, setForm] = React.useState(defaultForm);

  const resetForm = React.useCallback(() => {
    setForm(defaultForm);
  }, [defaultForm]);

  const refresh = React.useCallback(async () => {
    try {
      const [coursesRes, statsRes] = await Promise.all([
        fetch("/api/training/courses", { cache: "no-store" }),
        fetch("/api/training/stats", { cache: "no-store" }),
      ]);

      if (!coursesRes.ok) {
        const err = await coursesRes.json().catch(() => null);
        throw new Error(err?.error || "Failed to fetch courses");
      }
      if (!statsRes.ok) {
        const err = await statsRes.json().catch(() => null);
        throw new Error(err?.error || "Failed to fetch stats");
      }

      const coursesJson = await coursesRes.json();
      const statsJson = await statsRes.json();

      setCourses((coursesJson?.data?.courses ?? []) as TrainingCourse[]);
      setStats((statsJson?.data ?? null) as any);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || t.trainingCourses.loadFailed);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  // فلترة الدورات
  const filteredCourses = React.useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.titleEn?.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || course.status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" || course.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [courses, searchQuery, statusFilter, categoryFilter]);

  const handleCreateCourse = async (status: CourseStatus) => {
    try {
      const objectives = form.objectivesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const rawMax = form.maxParticipants.trim();
      const maxParticipants = rawMax ? Number(rawMax) : null;

      const locationOrLink = form.locationOrLink.trim();
      const isUrl = /^https?:\/\//i.test(locationOrLink);

      const payload = {
        title: form.title.trim(),
        titleEn: form.titleEn.trim() || undefined,
        description: form.description.trim(),
        descriptionEn: undefined,
        category: form.category,
        type: form.type,
        status,
        duration: Number.isFinite(form.duration) ? form.duration : 1,
        maxParticipants: Number.isFinite(maxParticipants as any) ? maxParticipants : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        instructorName: form.instructorName.trim() || null,
        location: !isUrl ? locationOrLink || null : null,
        meetingLink: isUrl ? locationOrLink : null,
        objectives,
        prerequisites: [],
      };

      const res = await fetch("/api/training/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to create course");
      }

      toast.success(status === "draft" ? t.trainingCourses.savedAsDraft : t.trainingCourses.createdSuccess);
      setIsAddSheetOpen(false);
      resetForm();
      await refresh();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || t.trainingCourses.createFailed);
    }
  };

  const handleViewCourse = (course: TrainingCourse) => {
    setSelectedCourse(course);
    setIsViewSheetOpen(true);
  };

  const handleDeleteCourse = async (id: string) => {
    setDeleteCourseId(id);
  };

  const confirmDeleteCourse = async () => {
    try {
      if (!deleteCourseId || isDeletingCourse) return;
      setIsDeletingCourse(true);

      const res = await fetch(`/api/training/courses/${deleteCourseId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to delete course");
      }

      toast.success(t.trainingCourses.deletedSuccess);
      setDeleteCourseId(null);
      await refresh();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || t.trainingCourses.deleteFailed);
    } finally {
      setIsDeletingCourse(false);
    }
  };

  const renderRating = (rating: number | undefined) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>
            {star <= Math.floor(rating) ? (
              <IconStarFilled className="h-3 w-3 text-yellow-500" />
            ) : (
              <IconStar className="h-3 w-3 text-yellow-500" />
            )}
          </span>
        ))}
        <span className="text-xs text-muted-foreground me-1">({rating})</span>
      </div>
    );
  };

  const getCourseTypeIcon = (type: CourseType) => {
    switch (type) {
      case "online":
        return <IconVideo className="h-4 w-4" />;
      case "in-person":
        return <IconMapPin className="h-4 w-4" />;
      default:
        return <IconBook className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* {t.trainingCourses.statsCards} */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.trainingCourses.totalCourses}</CardTitle>
            <IconBook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCourses ?? 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.activeCourses ?? 0} {t.trainingCourses.activeCourses}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.trainingCourses.enrolled}</CardTitle>
            <IconUsers className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.totalEnrollments ?? 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.completedEnrollments ?? 0} {t.trainingCourses.completedTraining}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.trainingCourses.trainingHours}</CardTitle>
            <IconClock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.totalHoursCompleted ?? 0}</div>
            <p className="text-xs text-muted-foreground">{t.trainingCourses.hoursCompleted}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.trainingCourses.certRate}</CardTitle>
            <IconCertificate className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.certificationRate ?? 0}%</div>
            <p className="text-xs text-muted-foreground">{t.trainingCourses.receivedCerts}</p>
          </CardContent>
        </Card>
      </div>

      {/* {t.trainingCourses.trainingBudget} */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{t.trainingCourses.trainingBudget}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress
              value={stats?.budgetTotal ? (stats.budgetUsed / stats.budgetTotal) * 100 : 0}
              className="h-3 flex-1"
            />
            <span className="text-sm font-medium">
              {(stats?.budgetUsed ?? 0).toLocaleString(numLocale)} / {(stats?.budgetTotal ?? 0).toLocaleString(numLocale)} {t.trainingCourses.sar}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t.trainingCourses.pUsed} {stats?.budgetTotal ? Math.round((stats.budgetUsed / stats.budgetTotal) * 100) : 0}{t.trainingCourses.budgetPercent}
          </p>
        </CardContent>
      </Card>

      {/* {t.trainingCourses.courseList} */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t.trainingCourses.title}</CardTitle>
              <CardDescription>{t.trainingCourses.subtitle}</CardDescription>
            </div>
            <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
              <SheetTrigger asChild>
                <Button>
                  <IconPlus className="ms-2 h-4 w-4" />
                  {t.trainingCourses.addCourse}
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{t.trainingCourses.addDialog}</SheetTitle>
                  <SheetDescription>
                    {t.trainingCourses.enterCourseDetails}
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">{t.trainingCourses.courseTitle}</Label>
                    <Input
                      id="title"
                      placeholder={t.trainingCourses.courseTitleExample}
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="titleEn">{t.trainingCourses.titleEnglish}</Label>
                    <Input
                      id="titleEn"
                      placeholder="e.g. Effective Communication Skills"
                      value={form.titleEn}
                      onChange={(e) => setForm((p) => ({ ...p, titleEn: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">{t.common.category}</Label>
                      <Select
                        value={form.category}
                        onValueChange={(v) =>
                          setForm((p) => ({ ...p, category: v as CourseCategory }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t.trainingCourses.chooseCat} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(courseCategoryLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="type">{t.trainingCourses.courseType}</Label>
                      <Select
                        value={form.type}
                        onValueChange={(v) => setForm((p) => ({ ...p, type: v as CourseType }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t.common.selectType} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(courseTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="duration">{t.trainingCourses.durationHours}</Label>
                      <Input
                        id="duration"
                        type="number"
                        placeholder="0"
                        value={String(form.duration)}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            duration: Math.max(1, Number(e.target.value || "1")),
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="maxParticipants">{t.trainingCourses.maxParticipants}</Label>
                      <Input
                        id="maxParticipants"
                        type="number"
                        placeholder="20"
                        value={form.maxParticipants}
                        onChange={(e) => setForm((p) => ({ ...p, maxParticipants: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startDate">{t.common.startDate}</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={form.startDate}
                        onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endDate">{t.common.endDate}</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={form.endDate}
                        onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="instructor">{t.trainingCourses.instructor}</Label>
                    <Input
                      id="instructor"
                      placeholder={t.trainingCourses.trainerName}
                      value={form.instructorName}
                      onChange={(e) => setForm((p) => ({ ...p, instructorName: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">{t.trainingCourses.venueOrLink}</Label>
                    <Input
                      id="location"
                      placeholder={t.trainingCourses.venue}
                      value={form.locationOrLink}
                      onChange={(e) => setForm((p) => ({ ...p, locationOrLink: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">{t.trainingCourses.courseDescription}</Label>
                    <Textarea
                      id="description"
                      placeholder={t.trainingCourses.descPlaceholder}
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="objectives">{t.trainingCourses.courseObjectives}</Label>
                    <Textarea
                      id="objectives"
                      placeholder={t.trainingCourses.objectivesPlaceholder}
                      rows={3}
                      value={form.objectivesText}
                      onChange={(e) => setForm((p) => ({ ...p, objectivesText: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button className="flex-1" onClick={() => handleCreateCourse("draft")}>
                      {t.trainingCourses.saveAsDraft}
                    </Button>
                    <Button variant="secondary" className="flex-1" onClick={() => handleCreateCourse("scheduled")}>
                      {t.trainingCourses.publishCourse}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>
        <CardContent>
          {/* {t.trainingCourses.searchFilter} */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row">
            <div className="relative flex-1">
              <IconSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t.trainingCourses.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={t.common.category} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.onboarding.allCategories}</SelectItem>
                {Object.entries(courseCategoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <IconFilter className="ms-2 h-4 w-4" />
                <SelectValue placeholder={t.common.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.common.allStatuses}</SelectItem>
                {Object.entries(courseStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* {t.trainingCourses.coursesTable} */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.trainingCourses.course}</TableHead>
                  <TableHead>{t.common.category}</TableHead>
                  <TableHead>{t.common.type}</TableHead>
                  <TableHead>{t.trainingCourses.durationHours}</TableHead>
                  <TableHead>{t.trainingCourses.participants}</TableHead>
                  <TableHead>{t.common.rating}</TableHead>
                  <TableHead>{t.common.status}</TableHead>
                  <TableHead className="text-start">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">{t.trainingCourses.noCourses}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{course.title}</p>
                          {course.titleEn && (
                            <p className="text-xs text-muted-foreground">{course.titleEn}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {courseCategoryLabels[course.category]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getCourseTypeIcon(course.type)}
                          <span className="text-sm">{courseTypeLabels[course.type]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{course.duration} {t.trainingCourses.hourUnit}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{course.currentParticipants}</span>
                        {course.maxParticipants && (
                          <span className="text-muted-foreground">/{course.maxParticipants}</span>
                        )}
                      </TableCell>
                      <TableCell>{renderRating(course.rating)}</TableCell>
                      <TableCell>
                        <Badge className={courseStatusColors[course.status]}>
                          {courseStatusLabels[course.status]}
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
                            <DropdownMenuItem onClick={() => handleViewCourse(course)}>
                              <IconEye className="ms-2 h-4 w-4" />{t.common.viewDetails}</DropdownMenuItem>
                            <DropdownMenuItem disabled onClick={() => toast.message(t.common.notAvailable)}
                            >
                              <IconEdit className="ms-2 h-4 w-4" />{t.common.edit}</DropdownMenuItem>
                            <DropdownMenuItem disabled onClick={() => toast.message(t.common.notAvailable)}
                            >
                              <IconUsers className="ms-2 h-4 w-4" />
                              {t.trainingCourses.participants}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteCourse(course.id)}
                            >
                              <IconTrash className="ms-2 h-4 w-4" />{t.common.delete}</DropdownMenuItem>
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

      {/* {t.trainingCourses.courseDetailsSheet} */}
      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedCourse?.title}</SheetTitle>
            <SheetDescription>{selectedCourse?.titleEn}</SheetDescription>
          </SheetHeader>
          {selectedCourse && (
            <div className="space-y-6 py-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={courseStatusColors[selectedCourse.status]}>
                  {courseStatusLabels[selectedCourse.status]}
                </Badge>
                <Badge variant="outline">
                  {courseCategoryLabels[selectedCourse.category]}
                </Badge>
                <Badge variant="outline">
                  {courseTypeLabels[selectedCourse.type]}
                </Badge>
                {selectedCourse.isMandatory && (
                  <Badge variant="destructive">{t.trainingCourses.mandatory}</Badge>
                )}
              </div>

              <div className="grid gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <IconClock className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedCourse.duration} {t.trainingCourses.hourUnit}</span>
                </div>
                {selectedCourse.startDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <IconCalendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(selectedCourse.startDate).toLocaleDateString("ar-SA")}
                      {selectedCourse.endDate && ` - ${new Date(selectedCourse.endDate).toLocaleDateString("ar-SA")}`}
                    </span>
                  </div>
                )}
                {selectedCourse.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <IconMapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedCourse.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <IconUsers className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {selectedCourse.currentParticipants}
                    {selectedCourse.maxParticipants && ` / ${selectedCourse.maxParticipants}`} {t.trainingCourses.participant}
                  </span>
                </div>
              </div>

              {selectedCourse.instructor && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-3">{t.trainingCourses.instructor}</h4>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={selectedCourse.instructor.avatar} alt="" />
                        <AvatarFallback>
                          {selectedCourse.instructor.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedCourse.instructor.name}</p>
                        {selectedCourse.instructor.title && (
                          <p className="text-sm text-muted-foreground">{selectedCourse.instructor.title}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">{t.common.description}</h4>
                <p className="text-sm text-muted-foreground">{selectedCourse.description}</p>
              </div>

              {selectedCourse.objectives.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">{t.trainingCourses.courseObjectives}</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {selectedCourse.objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedCourse.certificate && (
                <div>
                  <h4 className="font-semibold mb-2">{t.trainingCourses.certificate}</h4>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <IconCertificate className="h-5 w-5 text-primary" />
                      <span className="font-medium">{selectedCourse.certificate.name}</span>
                    </div>
                    {selectedCourse.certificate.validityPeriod && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {t.trainingCourses.validFor} {selectedCourse.certificate.validityPeriod} {t.trainingCourses.monthUnit}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button className="flex-1" disabled onClick={() => toast.message(t.common.notAvailable)}>
                  <IconUsers className="ms-2 h-4 w-4" />
                  {t.trainingCourses.manageParticipants}
                </Button>
                <Button variant="outline" className="flex-1" disabled onClick={() => toast.message(t.common.notAvailable)}>
                  <IconEdit className="ms-2 h-4 w-4" />
                  {t.trainingCourses.editCourse}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteCourseId !== null} onOpenChange={(open) => !open && setDeleteCourseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.trainingCourses.deleteCourse}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.trainingCourses.deleteConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCourse}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDeleteCourse()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingCourse}
            >
              {isDeletingCourse ? t.common.deleting : t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
