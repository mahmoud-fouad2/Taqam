import { LeaveRequestsManager } from "./leave-requests-manager";
import { CalendarOff } from "lucide-react";
import { Metadata } from "next";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "طلبات الإجازة",
    description: "مراجعة وإدارة طلبات الإجازة والغياب داخل منصة طاقم.",
  });
}

export default function LeaveRequestsPage() {
  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
            <CalendarOff className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">طلبات الإجازة</h1>
            <p className="text-sm text-muted-foreground">مراجعة وإدارة طلبات الإجازة والغياب</p>
          </div>
        </div>
      </div>
      <LeaveRequestsManager />
    </>
  );
}
