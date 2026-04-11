"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SupportTicketsSkeleton } from "@/components/skeletons/support-tickets-skeleton";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

type Ticket = {
  id: string;
  subject: string;
  category: string | null;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "RESOLVED" | "CLOSED";
  lastMessageAt: string;
  createdAt: string;
  tenant?: { id: string; slug: string; name: string; nameAr: string | null };
  createdBy?: { id: string; firstName: string; lastName: string; email: string };
  _count?: { messages: number };
};

type CommonText = {
  coming: string;
  helpCenter: string;
};

type LocaleText = ReturnType<typeof getText>;

function statusLabel(locale: "ar" | "en", status: Ticket["status"], t: LocaleText) {
  const mapAr: Record<Ticket["status"], string> = {
    OPEN: t.common.open,
    IN_PROGRESS: t.ideas.inProgress,
    WAITING_CUSTOMER: t.ideas.waitingCustomer,
    RESOLVED: t.common.resolved,
    CLOSED: t.common.closed
  };

  const mapEn: Record<Ticket["status"], string> = {
    OPEN: "Open",
    IN_PROGRESS: "In progress",
    WAITING_CUSTOMER: "Waiting customer",
    RESOLVED: "Resolved",
    CLOSED: "Closed"
  };

  return locale === "ar" ? mapAr[status] : mapEn[status];
}

function priorityLabel(locale: "ar" | "en", priority: Ticket["priority"], t: LocaleText) {
  const mapAr: Record<Ticket["priority"], string> = {
    LOW: t.common.low,
    NORMAL: t.common.normal,
    HIGH: t.common.high,
    URGENT: t.common.urgent
  };

  const mapEn: Record<Ticket["priority"], string> = {
    LOW: "Low",
    NORMAL: "Normal",
    HIGH: "High",
    URGENT: "Urgent"
  };

  return locale === "ar" ? mapAr[priority] : mapEn[priority];
}

function badgeVariantForStatus(
  status: Ticket["status"]
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "OPEN") return "secondary";
  if (status === "IN_PROGRESS") return "default";
  if (status === "WAITING_CUSTOMER") return "outline";
  if (status === "RESOLVED") return "secondary";
  return "outline";
}

export function SupportTicketsClient({
  locale: _locale,
  isSuperAdmin,
  tCommon
}: {
  locale: "ar" | "en";
  isSuperAdmin: boolean;
  tCommon: CommonText;
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  const p = locale === "en" ? "/en" : "";
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [openNew, setOpenNew] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<Ticket["priority"]>("NORMAL");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canCreate = !isSuperAdmin;

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tickets", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");
      setItems(json.data.items ?? []);
    } catch (e: any) {
      setError(e?.message || "Error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submitNew = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          category: category || undefined,
          priority,
          message
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");

      setOpenNew(false);
      setSubject("");
      setCategory("");
      setPriority("NORMAL");
      setMessage("");

      await load();
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const emptyText = useMemo(() => {
    if (loading) return locale === "ar" ? t.common.loading : "Loading...";
    if (error) return error;
    return locale === "ar" ? "لا توجد تذاكر حتى الآن" : "No tickets yet";
  }, [loading, error, locale, t.common.loading]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="secondary" asChild>
            <Link href={`${p}/dashboard/help-center`}>{tCommon.helpCenter}</Link>
          </Button>
          <Button variant="outline" onClick={() => void load()}>
            {locale === "ar" ? t.common.update : "Refresh"}
          </Button>
        </div>

        {canCreate ? (
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button>{locale === "ar" ? "فتح تذكرة جديدة" : "New ticket"}</Button>
            </DialogTrigger>
            <DialogContent className="w-full sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {locale === "ar" ? "تذكرة دعم جديدة" : "New support ticket"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">{locale === "ar" ? t.common.subject : "Subject"}</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">
                      {locale === "ar" ? t.common.category : "Category"}
                    </Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">
                      {locale === "ar" ? t.common.priority : "Priority"}
                    </Label>
                    <select
                      id="priority"
                      aria-label={locale === "ar" ? "أولوية التذكرة" : "Ticket priority"}
                      title={locale === "ar" ? "أولوية التذكرة" : "Ticket priority"}
                      className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Ticket["priority"])}>
                      <option value="LOW">{priorityLabel(locale, "LOW", t)}</option>
                      <option value="NORMAL">{priorityLabel(locale, "NORMAL", t)}</option>
                      <option value="HIGH">{priorityLabel(locale, "HIGH", t)}</option>
                      <option value="URGENT">{priorityLabel(locale, "URGENT", t)}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">{locale === "ar" ? "الرسالة" : "Message"}</Label>
                  <Textarea
                    id="message"
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={() => setOpenNew(false)}>
                    {locale === "ar" ? t.common.cancel : "Cancel"}
                  </Button>
                  <Button onClick={() => void submitNew()} disabled={submitting}>
                    {submitting
                      ? locale === "ar"
                        ? t.common.sending
                        : "Submitting..."
                      : locale === "ar"
                        ? t.common.send
                        : "Submit"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="text-muted-foreground text-sm">
            {locale === "ar"
              ? "إنشاء التذاكر من لوحة الشركة فقط."
              : "Tickets are created from a company dashboard."}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{locale === "ar" ? "التذاكر" : "Tickets"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SupportTicketsSkeleton />
          ) : items.length === 0 ? (
            <div className="text-muted-foreground py-10 text-center text-sm">{emptyText}</div>
          ) : (
            <div className="grid gap-3">
              {items.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`${p}/dashboard/support/${ticket.id}`}
                  className="bg-background hover:bg-muted/40 rounded-lg border p-4 transition-colors">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-medium">{ticket.subject}</h3>
                        <Badge variant={badgeVariantForStatus(ticket.status)}>
                          {statusLabel(locale, ticket.status, t)}
                        </Badge>
                        <Badge variant="outline">{priorityLabel(locale, ticket.priority, t)}</Badge>
                      </div>
                      <div className="text-muted-foreground mt-1 flex flex-wrap gap-2 text-xs">
                        {ticket.category ? <span>{ticket.category}</span> : null}
                        {isSuperAdmin && ticket.tenant ? (
                          <span>
                            {locale === "ar" ? t.common.company : "Tenant:"}{" "}
                            {ticket.tenant.nameAr || ticket.tenant.name} ({ticket.tenant.slug})
                          </span>
                        ) : null}
                        {ticket._count?.messages ? (
                          <span>
                            {locale === "ar" ? t.ideas.messages : "Messages:"}{" "}
                            {ticket._count.messages}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-muted-foreground text-xs">
                      {new Date(ticket.lastMessageAt).toLocaleString(
                        locale === "ar" ? "ar-SA" : "en-US"
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
