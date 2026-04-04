import { ShiftsManager } from "./shifts-manager";
import { CalendarClock } from "lucide-react";

export const metadata = {
  title: "الورديات | طاقم",
  description: "إدارة ورديات العمل",
};

export default function ShiftsPage() {
  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
            <CalendarClock className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">الورديات</h1>
            <p className="text-sm text-muted-foreground">إدارة ورديات العمل وأوقات الدوام</p>
          </div>
        </div>
      </div>
      <ShiftsManager />
    </>
  );
}
