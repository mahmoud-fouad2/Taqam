import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RequestActions } from "./request-actions";
import { getAppLocale } from "@/lib/i18n/locale";
import { getText } from "@/lib/i18n/text";

type LocaleText = ReturnType<typeof getText>;

function mapStatus(
  status: string,
  t: LocaleText
): { label: string; variant: "default" | "secondary" | "destructive" } {
  if (status === "PENDING") return { label: t.common.pending, variant: "secondary" };
  if (status === "APPROVED") return { label: t.common.accepted, variant: "default" };
  return { label: t.common.rejected, variant: "destructive" };
}

export default async function SuperAdminRequestDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getAppLocale();
  const t = getText(locale);
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    // Keep behavior consistent with the rest of admin APIs.
    notFound();
  }

  const { id } = await params;

  const item = await prisma.tenantRequest.findUnique({ where: { id } });
  if (!item) notFound();

  const status = mapStatus(item.status, t);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t.superAdmin.pSubscriptionRequestDetails}</h1>
            <p className="text-sm text-muted-foreground">{t.superAdmin.pReviewCompanyDataAndContactInf}</p>
          </div>
          <Link
            href="/dashboard/super-admin/requests"
            className="inline-flex h-9 items-center rounded-md border border-border/60 bg-background px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            {t.superAdmin.pBackToRequests}
          </Link>
        </div>
      </section>

      <Card className="border-border/60 bg-card/85 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">{item.companyNameAr ?? item.companyName}</CardTitle>
            <CardDescription>{item.companyNameAr ? item.companyName : null}</CardDescription>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm font-medium">{t.superAdmin.pContactName}</div>
              <div className="text-sm text-muted-foreground">{item.contactName}</div>
            </div>
            <div>
              <div className="text-sm font-medium">{t.common.email}</div>
              <div className="text-sm text-muted-foreground">{item.contactEmail}</div>
            </div>
            <div>
              <div className="text-sm font-medium">{t.common.phone}</div>
              <div className="text-sm text-muted-foreground">{item.contactPhone ?? "—"}</div>
            </div>
            <div>
              <div className="text-sm font-medium">{t.common.employees}</div>
              <div className="text-sm text-muted-foreground">{item.employeeCount ?? "—"}</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium">{t.superAdmin.pMessage}</div>
            <div className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
              {item.message ?? "—"}
            </div>
          </div>

          <div className="pt-2">
            <RequestActions requestId={item.id} status={item.status} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
