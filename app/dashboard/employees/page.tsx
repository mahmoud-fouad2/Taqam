import type { Metadata } from "next";
import { generateMeta } from "@/lib/utils";
import { EmployeesManager } from "./employees-manager";
import { Users } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "الموظفون - Employees",
    description: "إدارة بيانات الموظفين - Core HR Phase 3",
  });
}

export default function EmployeesPage() {
  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">الموظفون</h1>
            <p className="text-sm text-muted-foreground">إدارة بيانات الموظفين والسجلات الوظيفية</p>
          </div>
        </div>
      </div>
      <EmployeesManager />
    </>
  );
}
