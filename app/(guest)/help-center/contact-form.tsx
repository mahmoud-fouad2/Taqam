"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface Props {
  supportEmail: string;
  isAr: boolean;
}

export function ContactForm({ supportEmail, isAr }: Props) {
  const [form, setForm] = useState({ name: "", company: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = [
      `${isAr ? "الاسم" : "Name"}: ${form.name}`,
      form.company ? `${isAr ? "الشركة" : "Company"}: ${form.company}` : "",
      `${isAr ? "البريد الإلكتروني" : "Email"}: ${form.email}`,
      "",
      form.message,
    ]
      .filter(Boolean)
      .join("\n");

    const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent(form.subject || (isAr ? "استفسار من الموقع" : "Website inquiry"))}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_blank");
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  const input =
    "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground";

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-primary/5 p-10 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Send className="h-6 w-6 text-primary" />
        </div>
        <p className="font-semibold">{isAr ? "شكرًا! جاري فتح تطبيق البريد الإلكتروني." : "Thanks! Your email client is opening."}</p>
        <p className="text-sm text-muted-foreground">
          {isAr ? "تأكد من إرسال الرسالة من برنامج البريد الخاص بك." : "Please send the message from your email client."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            {isAr ? "الاسم" : "Full name"} <span className="text-destructive">*</span>
          </label>
          <input
            required
            name="name"
            value={form.name}
            onChange={handle}
            placeholder={isAr ? "محمد أحمد" : "John Smith"}
            className={input}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">{isAr ? "الشركة (اختياري)" : "Company (optional)"}</label>
          <input
            name="company"
            value={form.company}
            onChange={handle}
            placeholder={isAr ? "اسم الشركة" : "Company name"}
            className={input}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">
          {isAr ? "البريد الإلكتروني" : "Email"} <span className="text-destructive">*</span>
        </label>
        <input
          required
          type="email"
          name="email"
          value={form.email}
          onChange={handle}
          placeholder="you@example.com"
          className={input}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">{isAr ? "الموضوع" : "Subject"}</label>
        <select
          name="subject"
          value={form.subject}
          onChange={handle}
          className={input}
          aria-label={isAr ? "موضوع الرسالة" : "Message subject"}
          title={isAr ? "موضوع الرسالة" : "Message subject"}
        >
          <option value="">{isAr ? "اختر موضوعًا..." : "Select a subject..."}</option>
          <option value={isAr ? "استفسار عن الأسعار" : "Pricing inquiry"}>
            {isAr ? "استفسار عن الأسعار" : "Pricing inquiry"}
          </option>
          <option value={isAr ? "مشكلة تقنية" : "Technical issue"}>
            {isAr ? "مشكلة تقنية" : "Technical issue"}
          </option>
          <option value={isAr ? "طلب إعداد وتأهيل" : "Setup & onboarding"}>
            {isAr ? "طلب إعداد وتأهيل" : "Setup & onboarding"}
          </option>
          <option value={isAr ? "طلب ميزة جديدة" : "Feature request"}>
            {isAr ? "طلب ميزة جديدة" : "Feature request"}
          </option>
          <option value={isAr ? "موضوع آخر" : "Other"}>{isAr ? "موضوع آخر" : "Other"}</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">
          {isAr ? "الرسالة" : "Message"} <span className="text-destructive">*</span>
        </label>
        <textarea
          required
          name="message"
          value={form.message}
          onChange={handle}
          rows={5}
          placeholder={isAr ? "اكتب رسالتك هنا..." : "Describe your question or issue..."}
          className={`${input} resize-none`}
        />
      </div>

      <Button type="submit" variant="brand" size="lg" className="w-full gap-2">
        <Send className="h-4 w-4" />
        {isAr ? "إرسال الرسالة" : "Send message"}
      </Button>
    </form>
  );
}
