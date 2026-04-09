import { TrainingEnrollmentsManager } from "./training-enrollments-manager";
import { getText } from "@/lib/i18n/text";
import { getAppLocale } from "@/lib/i18n/locale";

export default async function TrainingEnrollmentsPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.academy.enrollments}</h1>
          <p className="text-muted-foreground">{t.trainingEnrollments.pTrackEmployeeCourseEnrollments}</p>
        </div>
      </div>
      <TrainingEnrollmentsManager />
    </div>
  );
}
