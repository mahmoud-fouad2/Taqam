import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-5xl font-bold tracking-tight text-foreground">404</h1>
        <h2 className="text-2xl font-semibold">الصفحة غير موجودة</h2>
        <p className="max-w-md text-muted-foreground">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">العودة للرئيسية</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">لوحة التحكم</Link>
        </Button>
      </div>
    </div>
  );
}
