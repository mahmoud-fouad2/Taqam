import type { Metadata } from "next";
import { generateMeta } from "@/lib/utils";
import { DepartmentsManager } from "./departments-manager";
import { Layers } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "الأقسام - Departments",
    description: "إدارة أقسام الشركة - Core HR Phase 3",
  });
}

export default function DepartmentsPage() {
  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
            <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">الأقسام</h1>
            <p className="text-sm text-muted-foreground">إدارة الهيكل التنظيمي وأقسام الشركة</p>
          </div>
        </div>
      </div>
      <DepartmentsManager />
    </>
  );
}
