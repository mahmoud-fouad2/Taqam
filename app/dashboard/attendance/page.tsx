import { AttendanceManager } from "./attendance-manager";
import { Clock } from "lucide-react";

export const metadata = {
  title: "الحضور والانصراف | طاقم",
  description: "تسجيل ومتابعة الحضور والانصراف",
};

export default function AttendancePage() {
  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
            <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">الحضور والانصراف</h1>
            <p className="text-sm text-muted-foreground">تسجيل ومتابعة الحضور والانصراف اليومي</p>
          </div>
        </div>
      </div>
      <AttendanceManager />
    </>
  );
}
