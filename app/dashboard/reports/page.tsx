import { ReportsView } from "./reports-view";
import { BarChart3 } from "lucide-react";

export const metadata = {
  title: "التقارير | طاقم",
  description: "تقارير الحضور والانصراف",
};

export default function ReportsPage() {
  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
            <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">التقارير</h1>
            <p className="text-sm text-muted-foreground">تقارير وإحصائيات الحضور والانصراف</p>
          </div>
        </div>
      </div>
      <ReportsView />
    </>
  );
}
