import Link from "next/link";

import { CalendarCheck2, Layers3, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type RegisterFormProps = {
  locale: "ar" | "en";
  labels: {
    summary: string;
    steps: string[];
    primaryAction: string;
    secondaryAction: string;
    inviteNote: string;
  };
};

export function RegisterForm({ locale, labels }: RegisterFormProps) {
  const prefix = locale === "en" ? "/en" : "";
  const icons = [CalendarCheck2, ShieldCheck, Layers3];

  return (
    <div className="mt-8 space-y-6">
      <Card className="border-border/60 bg-card/80 rounded-3xl border shadow-sm">
        <CardContent className="space-y-5 p-6">
          <p className="text-muted-foreground text-sm leading-7">{labels.summary}</p>

          <div className="space-y-3">
            {labels.steps.map((step, index) => {
              const Icon = icons[index] ?? ShieldCheck;

              return (
                <div key={step} className="flex items-start gap-3 rounded-2xl border px-4 py-3">
                  <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="text-primary h-4 w-4" />
                  </div>
                  <p className="text-sm leading-6">{step}</p>
                </div>
              );
            })}
          </div>

          <p className="text-muted-foreground text-xs leading-6">{labels.inviteNote}</p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild className="h-11 w-full" variant="brand">
          <Link href={`${prefix}/request-demo`}>{labels.primaryAction}</Link>
        </Button>
        <Button asChild className="h-11 w-full" variant="outline">
          <Link href={`${prefix}/plans`}>{labels.secondaryAction}</Link>
        </Button>
      </div>
    </div>
  );
}
