"use client";

import { ChevronLeft, Plus, Settings } from "lucide-react";

import type { ApprovalWorkflow } from "@/lib/types/settings";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function WorkflowsSection({ workflows }: { workflows: ApprovalWorkflow[] }) {
  const locale = useClientLocale();
  const t = getText(locale);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t.workflows.title}
            </CardTitle>
            <CardDescription>{t.workflows.subtitle}</CardDescription>
          </div>
          <Button disabled onClick={() => toast.message(t.common.notAvailable)}>
            <Plus className="ms-2 h-4 w-4" />
            {t.workflows.newWorkflow}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workflows.length === 0 ? (
            <div className="text-muted-foreground py-10 text-center">{t.workflows.empty}</div>
          ) : (
            workflows.map((workflow) => (
              <div key={workflow.id} className="rounded-lg border p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{workflow.name}</h4>
                    <Badge variant="outline">{workflow.type}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={workflow.isActive ? "default" : "secondary"}>
                      {workflow.isActive ? t.workflows.active : t.workflows.inactive}
                    </Badge>
                    <Button variant="outline" size="sm" disabled>
                      {t.common.edit}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {workflow.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <div className="bg-muted flex items-center gap-2 rounded-lg px-3 py-2">
                        <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs">
                          {step.order}
                        </span>
                        <span className="text-sm">
                          {step.approverType === "direct-manager"
                            ? t.workflows.directManager
                            : step.approverType === "department-head"
                              ? t.workflows.deptManager
                              : step.approverType === "hr"
                                ? t.workflows.hr
                                : step.approverType}
                        </span>
                      </div>
                      {index < workflow.steps.length - 1 && (
                        <ChevronLeft className="text-muted-foreground h-4 w-4" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
