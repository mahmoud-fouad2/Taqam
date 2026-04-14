export const AUTOMATION_TRIGGER_TYPES = [
  "leave.requested",
  "leave.approved",
  "leave.rejected",
  "payslip.ready"
] as const;

export type AutomationTriggerType = (typeof AUTOMATION_TRIGGER_TYPES)[number];

export const AUTOMATION_TRIGGER_LABELS: Record<
  AutomationTriggerType,
  { ar: string; en: string }
> = {
  "leave.requested": { ar: "عند تقديم طلب إجازة", en: "When a leave request is submitted" },
  "leave.approved": { ar: "عند الموافقة على الإجازة", en: "When a leave request is approved" },
  "leave.rejected": { ar: "عند رفض الإجازة", en: "When a leave request is rejected" },
  "payslip.ready": { ar: "عند جاهزية قسيمة الراتب", en: "When a payslip becomes ready" }
};

export type AutomationWorkflowSummary = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  triggerType: string;
  enabled: boolean;
  isBuiltin: boolean;
  version: number;
  conditionsCount: number;
  actionsCount: number;
  updatedAt: string;
  latestRun:
    | {
        id: string;
        status: string;
        summary: string | null;
        retryCount: number;
        startedAt: string;
        finishedAt: string | null;
      }
    | null;
};

export type AutomationRunSummary = {
  id: string;
  workflowId: string;
  workflowName: string;
  triggerType: string;
  status: string;
  summary: string | null;
  failureReason: string | null;
  retryCount: number;
  startedAt: string;
  finishedAt: string | null;
};

export type AutomationDashboardData = {
  workflows: AutomationWorkflowSummary[];
  runs: AutomationRunSummary[];
};