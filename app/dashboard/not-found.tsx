import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">الصفحة غير موجودة</h2>
        <p className="max-w-md text-muted-foreground">
          عذراً، هذه الصفحة غير موجودة أو ليس لديك صلاحية الوصول إليها.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/dashboard">العودة للوحة التحكم</Link>
        </Button>
        <Button variant="outline" onClick={() => window.history.back()} type="button">
          رجوع
        </Button>
      </div>
    </div>
  );
}
