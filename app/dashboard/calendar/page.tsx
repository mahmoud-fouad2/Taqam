import { CalendarView } from "./calendar-view";
import { CalendarDays } from "lucide-react";

export const metadata = {
  title: "التقويم | طاقم",
  description: "عرض تقويم الحضور والانصراف",
};

export default function CalendarPage() {
  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10">
            <CalendarDays className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">التقويم</h1>
            <p className="text-sm text-muted-foreground">عرض تقويمي لسجل الحضور والانصراف</p>
          </div>
        </div>
      </div>
      <CalendarView />
    </>
  );
}
