/**
 * Subscription Requests Page (Inbox)
 * صفحة طلبات الاشتراك
 */

import { Suspense } from "react";
import { Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RequestsTable } from "./requests-table";
import { getText } from "@/lib/i18n/text";
import { getAppLocale } from "@/lib/i18n/locale";

export default async function RequestsPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return (
    <div className="space-y-6">
      <section className="border-border/60 bg-card/80 supports-[backdrop-filter]:bg-card/70 rounded-2xl border p-5 shadow-sm backdrop-blur">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Inbox className="h-6 w-6" />
          {t.superAdmin.pSubscriptionRequests}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t.superAdmin.pManageIncomingSubscriptionRequ}
        </p>
      </section>

      <Card className="border-border/60 bg-card/85 overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <Suspense fallback={<div className="p-8 text-center">{t.common.loading}</div>}>
            <RequestsTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
