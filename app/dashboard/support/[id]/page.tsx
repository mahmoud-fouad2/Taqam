import type { Metadata } from "next";
import Link from "next/link";

import prisma from "@/lib/db";
import { guardAuth } from "@/lib/guards";
import { getCurrentUser } from "@/lib/auth";
import { getAppLocale } from "@/lib/i18n/locale";
import { generateMeta } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { TicketThread } from "./ticket-thread";
import { getText } from "@/lib/i18n/text";

function isSuperAdmin(role: string | undefined) {
  return role === "SUPER_ADMIN";
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAppLocale();
  return generateMeta({
    title: locale === "ar" ? "تفاصيل التذكرة" : "Ticket details",
    description: locale === "ar" ? "عرض تفاصيل تذكرة الدعم." : "View support ticket details.",
  });
}

export default async function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await guardAuth();

  const { id } = await params;
  const user = await getCurrentUser();
  const locale = await getAppLocale();
  const t = getText(locale);
  const p = locale === "en" ? "/en" : "";

  if (!user) {
    return null;
  }

  const where: any = { id };
  if (!isSuperAdmin(user.role)) {
    where.tenantId = user.tenantId;
  }

  const ticket = await prisma.supportTicket.findFirst({
    where,
    include: {
      tenant: { select: { id: true, slug: true, name: true, nameAr: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
      },
    },
  });

  if (!ticket) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{locale === "ar" ? "غير موجود" : "Not found"}</h1>
          <Button asChild variant="secondary">
            <Link href={`${p}/dashboard/support`}>{locale === "ar" ? t.common.back : "Back"}</Link>
          </Button>
        </div>
        <p className="text-muted-foreground">{locale === "ar" ? "لم يتم العثور على التذكرة." : "Ticket was not found."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">{ticket.subject}</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
            {ticket.category ? <span>{ticket.category}</span> : null}
            <Badge variant="outline">{ticket.priority}</Badge>
            <Badge variant="secondary">{ticket.status}</Badge>
            {isSuperAdmin(user.role) ? (
              <span>
                {locale === "ar" ? t.common.company : "Tenant:"} {ticket.tenant.nameAr || ticket.tenant.name} ({ticket.tenant.slug})
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href={`${p}/dashboard/support`}>{locale === "ar" ? t.common.back : "Back"}</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{locale === "ar" ? "المحادثة" : "Conversation"}</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketThread
            locale={locale}
            ticketId={ticket.id}
            initialMessages={ticket.messages.map((m) => ({
              id: m.id,
              body: m.body,
              isInternal: m.isInternal,
              createdAt: m.createdAt.toISOString(),
              sender: {
                id: m.sender.id,
                firstName: m.sender.firstName,
                lastName: m.sender.lastName,
                email: m.sender.email,
                role: m.sender.role,
              },
            }))}
            canAddInternalNote={isSuperAdmin(user.role)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
