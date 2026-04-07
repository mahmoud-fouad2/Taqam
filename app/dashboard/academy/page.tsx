import Link from "next/link";
import { ArrowUpRight, BookOpen, CalendarClock, GraduationCap, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/db";
import { getPageContext } from "@/lib/guards";
import { getAppLocale } from "@/lib/i18n/locale";
import { getText } from "@/lib/i18n/text";

const statusLabels = {
  ar: {
    SCHEDULED: "مجدول",
    ONGOING: "جاري الآن",
    COMPLETED: "مكتمل",
    CANCELLED: "ملغي",
    DRAFT: "مسودة",
  },
  en: {
    SCHEDULED: "Scheduled",
    ONGOING: "Ongoing",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    DRAFT: "Draft",
  },
} as const;

const typeLabels = {
  ar: {
    IN_PERSON: "حضوري",
    ONLINE: "عن بعد",
    HYBRID: "مختلط",
    SELF_PACED: "ذاتي",
    WORKSHOP: "ورشة",
    CONFERENCE: "مؤتمر",
  },
  en: {
    IN_PERSON: "In person",
    ONLINE: "Online",
    HYBRID: "Hybrid",
    SELF_PACED: "Self-paced",
    WORKSHOP: "Workshop",
    CONFERENCE: "Conference",
  },
} as const;

export default async function AcademyPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  const ctx = await getPageContext();
  const tenantId = ctx.user?.tenantId ?? null;
  const isAr = locale === "ar";
  const prefix = locale === "en" ? "/en" : "";

  if (!tenantId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t.common.academy}</h1>
          <p className="text-muted-foreground">
            {isAr
              ? "الأكاديمية تعرض محتوى التدريب داخل مساحات الشركات. ادخل إلى لوحة شركة لعرض الدورات والتسجيلات الفعلية."
              : "The academy surfaces tenant training content. Open a company workspace to view real courses and enrollments."}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "لا توجد مساحة شركة نشطة" : "No active tenant workspace"}</CardTitle>
            <CardDescription>
              {isAr
                ? "يمكنك متابعة الطلبات أو إدارة الشركات من السوبر أدمن، لكن محتوى الأكاديمية نفسه مرتبط ببيانات التدريب داخل كل شركة."
                : "You can keep working in super admin, but academy content is tied to tenant training data."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const [totalCourses, activeCourses, mandatoryCourses, totalEnrollments, upcomingCourses, latestCourses] = await Promise.all([
    prisma.trainingCourse.count({
      where: { tenantId, status: { not: "DRAFT" } },
    }),
    prisma.trainingCourse.count({
      where: { tenantId, status: { in: ["SCHEDULED", "ONGOING"] } },
    }),
    prisma.trainingCourse.count({
      where: { tenantId, status: { not: "DRAFT" }, isMandatory: true },
    }),
    prisma.trainingEnrollment.count({ where: { tenantId } }),
    prisma.trainingCourse.findMany({
      where: {
        tenantId,
        status: { in: ["SCHEDULED", "ONGOING"] },
        startDate: { not: null },
      },
      orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
      take: 4,
      include: { _count: { select: { enrollments: true } } },
    }),
    prisma.trainingCourse.findMany({
      where: { tenantId, status: { not: "DRAFT" } },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { _count: { select: { enrollments: true } } },
    }),
  ]);

  const dateFormatter = new Intl.DateTimeFormat(isAr ? "ar-SA" : "en-US", { dateStyle: "medium" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.common.academy}</h1>
        <p className="text-muted-foreground">
          {isAr
            ? "مركز تعلم فعلي مرتبط بدورات التدريب المسجلة داخل شركتك، مع نظرة سريعة على الجلسات القادمة والتسجيلات الحالية."
            : "A live learning hub connected to your tenant training data, with upcoming sessions and active enrollments."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: isAr ? "الدورات المنشورة" : "Published courses",
            value: totalCourses,
            icon: BookOpen,
          },
          {
            label: isAr ? "الدورات النشطة" : "Active courses",
            value: activeCourses,
            icon: CalendarClock,
          },
          {
            label: isAr ? "الدورات الإلزامية" : "Mandatory courses",
            value: mandatoryCourses,
            icon: GraduationCap,
          },
          {
            label: isAr ? "إجمالي التسجيلات" : "Total enrollments",
            value: totalEnrollments,
            icon: Users,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label}>
              <CardHeader className="pb-2">
                <CardDescription>{item.label}</CardDescription>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-3xl">{item.value}</CardTitle>
                  <div className="rounded-lg bg-muted p-2">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "الجلسات القادمة" : "Upcoming sessions"}</CardTitle>
            <CardDescription>
              {isAr ? "مستمد مباشرة من الدورات المجدولة والجارية داخل النظام." : "Pulled directly from scheduled and ongoing courses."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingCourses.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                {isAr
                  ? "لا توجد جلسات قادمة الآن. ابدأ بإضافة دورة من إدارة التدريب لتظهر هنا تلقائيًا."
                  : "There are no upcoming sessions yet. Create a course in Training Management and it will appear here automatically."}
              </div>
            ) : (
              upcomingCourses.map((course) => (
                <div key={course.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{isAr ? course.title : course.titleEn || course.title}</h3>
                    <Badge variant={course.status === "ONGOING" ? "default" : "secondary"}>
                      {statusLabels[isAr ? "ar" : "en"][course.status]}
                    </Badge>
                    <Badge variant="outline">{typeLabels[isAr ? "ar" : "en"][course.type]}</Badge>
                    {course.isMandatory ? (
                      <Badge variant="outline">{isAr ? "إلزامية" : "Mandatory"}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isAr ? course.description : course.descriptionEn || course.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{dateFormatter.format(course.startDate as Date)}</span>
                    <span>
                      {isAr ? "المدة:" : "Duration:"} {course.durationHours} {isAr ? "ساعة" : "hours"}
                    </span>
                    <span>
                      {isAr ? "المسجلون:" : "Enrollments:"} {course._count.enrollments}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "أحدث الدورات المفعلة" : "Latest live courses"}</CardTitle>
            <CardDescription>
              {isAr ? "آخر الدورات المنشورة فعليًا داخل مساحة الشركة." : "Recently published training content in the current tenant."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestCourses.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                {isAr
                  ? "لا توجد دورات منشورة بعد. استخدم إدارة الدورات التدريبية لبدء مكتبة التعلم." 
                  : "No published courses yet. Use training management to start the learning library."}
              </div>
            ) : (
              latestCourses.map((course) => (
                <div key={course.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{isAr ? course.title : course.titleEn || course.title}</h3>
                    <Badge variant="outline">{statusLabels[isAr ? "ar" : "en"][course.status]}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {isAr ? course.description : course.descriptionEn || course.description}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>
                      {isAr ? "المُنشأة:" : "Created:"} {dateFormatter.format(course.createdAt)}
                    </span>
                    <span>
                      {isAr ? "المدة:" : "Duration:"} {course.durationHours} {isAr ? "ساعة" : "hours"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "مسارات مرتبطة" : "Connected paths"}</CardTitle>
          <CardDescription>
            {isAr
              ? "روابط تشغيلية مرتبطة بنفس بيانات التدريب والمساندة داخل النظام."
              : "Operational entry points connected to the same training and support data."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            {
              href: `${prefix}/dashboard/training-courses`,
              title: isAr ? "إدارة الدورات" : "Manage courses",
              desc: isAr ? "إنشاء وجدولة ومتابعة الدورات التدريبية." : "Create, schedule, and manage training programs.",
            },
            {
              href: `${prefix}/dashboard/training-enrollments`,
              title: isAr ? "تسجيلات التدريب" : "Training enrollments",
              desc: isAr ? "مراجعة المشاركين والحالات والتقدم." : "Review participants, statuses, and progress.",
            },
            {
              href: `${prefix}/dashboard/help-center`,
              title: isAr ? "مركز المساعدة" : "Help center",
              desc: isAr ? "الرجوع إلى الأدلة ومسارات الاستخدام الأساسية." : "Open the help center and operational guides.",
            },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="rounded-xl border p-4 transition hover:bg-muted/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{item.desc}</div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
