"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type Message = {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
};

export function TicketThread({
  locale,
  ticketId,
  initialMessages,
  canAddInternalNote,
}: {
  locale: "ar" | "en";
  ticketId: string;
  initialMessages: Message[];
  canAddInternalNote: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const title = useMemo(() => {
    return locale === "ar" ? "إضافة رد" : "Add reply";
  }, [locale]);

  const submit = async () => {
    setSubmitting(true);

    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, isInternal }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");

      setMessages((prev) => [...prev, {
        id: json.data.id,
        body: json.data.body,
        isInternal: json.data.isInternal,
        createdAt: json.data.createdAt,
        sender: json.data.sender,
      }]);

      setBody("");
      setIsInternal(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (locale === "ar" ? "تعذر إرسال الرد" : "Failed to send");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className="rounded-lg border bg-background p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="truncate text-sm font-medium">
                    {m.sender.firstName} {m.sender.lastName}
                  </div>
                  <Badge variant="outline" className="text-[11px]">{m.sender.role}</Badge>
                  {m.isInternal ? (
                    <Badge variant="destructive" className="text-[11px]">
                      {locale === "ar" ? "ملاحظة داخلية" : "Internal"}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString(locale === "ar" ? "ar-SA" : "en-US")}</div>
              </div>
            </div>
            <div className="mt-3 whitespace-pre-wrap text-sm">{m.body}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-muted/20 p-4">
        <div className="text-sm font-medium">{title}</div>

        {canAddInternalNote ? (
          <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
            />
            {locale === "ar" ? "ملاحظة داخلية (للإدارة فقط)" : "Internal note (admin only)"}
          </label>
        ) : null}

        <Textarea
          className="mt-3"
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={locale === "ar" ? "اكتب ردك هنا..." : "Write your reply..."}
        />

                <div className="mt-3 flex justify-end">
          <Button onClick={() => void submit()} disabled={submitting || body.trim().length === 0}>
            {submitting ? (locale === "ar" ? "جاري الإرسال..." : "Sending...") : locale === "ar" ? "إرسال" : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
