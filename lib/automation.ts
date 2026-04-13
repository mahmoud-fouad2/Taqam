import prisma from "@/lib/db";
import { sendBulkNotification, type NotificationType } from "@/lib/notifications/send";
import type { Prisma, WorkflowDefinition, WorkflowRun } from "@prisma/client";

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

type WorkflowConditionOperator = "exists" | "equals" | "notEquals" | "in";

export type WorkflowCondition = {
  field: string;
  operator: WorkflowConditionOperator;
  value?: unknown;
};

export type NotificationWorkflowAction = {
  type: "notification";
  notificationType?: NotificationType;
  recipientField: string;
  title: string;
  message: string;
  link?: string;
};

export type WorkflowActionDefinition = NotificationWorkflowAction;

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

type AutomationPayload = Record<string, unknown>;

type DefaultWorkflowSeed = {
  key: string;
  name: string;
  description: string;
  triggerType: AutomationTriggerType;
  conditions?: WorkflowCondition[];
  actions: WorkflowActionDefinition[];
};

const DEFAULT_WORKFLOWS: DefaultWorkflowSeed[] = [
  {
    key: "builtin.leave-request-manager",
    name: "إشعار المدير بطلب إجازة جديد",
    description: "يرسل إشعاراً إلى مدير الموظف عند تقديم طلب إجازة جديد.",
    triggerType: "leave.requested",
    conditions: [{ field: "managerUserId", operator: "exists" }],
    actions: [
      {
        type: "notification",
        notificationType: "leave-request",
        recipientField: "managerUserId",
        title: "طلب إجازة جديد",
        message: "{{employeeName}} طلب إجازة {{leaveType}} من {{startDate}} إلى {{endDate}}",
        link: "/dashboard/leave-requests?id={{requestId}}"
      }
    ]
  },
  {
    key: "builtin.leave-approved-employee",
    name: "إشعار الموظف بالموافقة على الإجازة",
    description: "يرسل إشعاراً للموظف عند الموافقة على طلب الإجازة.",
    triggerType: "leave.approved",
    conditions: [{ field: "employeeUserId", operator: "exists" }],
    actions: [
      {
        type: "notification",
        notificationType: "leave-approved",
        recipientField: "employeeUserId",
        title: "تمت الموافقة على طلب الإجازة",
        message: "تمت الموافقة على طلب إجازة {{leaveType}} الخاص بك",
        link: "/dashboard/my-requests?id={{requestId}}"
      }
    ]
  },
  {
    key: "builtin.leave-rejected-employee",
    name: "إشعار الموظف برفض الإجازة",
    description: "يرسل إشعاراً للموظف عند رفض طلب الإجازة.",
    triggerType: "leave.rejected",
    conditions: [{ field: "employeeUserId", operator: "exists" }],
    actions: [
      {
        type: "notification",
        notificationType: "leave-rejected",
        recipientField: "employeeUserId",
        title: "تم رفض طلب الإجازة",
        message:
          "تم رفض طلب إجازة {{leaveType}} الخاص بك{{rejectionSuffix}}",
        link: "/dashboard/my-requests?id={{requestId}}"
      }
    ]
  },
  {
    key: "builtin.payslip-ready-employee",
    name: "إشعار جاهزية قسيمة الراتب",
    description: "يرسل إشعاراً للموظف عند جاهزية قسيمة الراتب.",
    triggerType: "payslip.ready",
    conditions: [{ field: "employeeUserId", operator: "exists" }],
    actions: [
      {
        type: "notification",
        notificationType: "payslip-ready",
        recipientField: "employeeUserId",
        title: "قسيمة الراتب جاهزة",
        message: "قسيمة راتب {{periodName}} متاحة الآن",
        link: "/dashboard/payslips"
      }
    ]
  }
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

function getByPath(payload: AutomationPayload, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!isRecord(current)) return undefined;
    return current[segment];
  }, payload);
}

function interpolateTemplate(template: string | undefined, payload: AutomationPayload): string | undefined {
  if (!template) return template;
  return template.replace(/{{\s*([^}]+)\s*}}/g, (_match, rawKey: string) => {
    const value = getByPath(payload, rawKey.trim());
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) return value.join(", ");
    return String(value);
  });
}

function parseConditions(raw: unknown): WorkflowCondition[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter(isRecord)
    .map((entry) => {
      const operator: WorkflowConditionOperator =
        entry.operator === "exists" ||
        entry.operator === "equals" ||
        entry.operator === "notEquals" ||
        entry.operator === "in"
          ? entry.operator
          : "exists";

      return {
        field: typeof entry.field === "string" ? entry.field : "",
        operator,
        value: entry.value
      };
    })
    .filter((entry) => entry.field.length > 0);
}

function parseActions(raw: unknown): WorkflowActionDefinition[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter(isRecord)
    .flatMap((entry) => {
      if (entry.type !== "notification") return [];
      if (typeof entry.recipientField !== "string") return [];
      if (typeof entry.title !== "string" || typeof entry.message !== "string") return [];

      return [
        {
          type: "notification" as const,
          notificationType:
            typeof entry.notificationType === "string"
              ? (entry.notificationType as NotificationType)
              : "general",
          recipientField: entry.recipientField,
          title: entry.title,
          message: entry.message,
          link: typeof entry.link === "string" ? entry.link : undefined
        }
      ];
    });
}

function evaluateCondition(payload: AutomationPayload, condition: WorkflowCondition): boolean {
  const actual = getByPath(payload, condition.field);

  switch (condition.operator) {
    case "exists":
      return !(actual === null || actual === undefined || actual === "");
    case "equals":
      return actual === condition.value;
    case "notEquals":
      return actual !== condition.value;
    case "in":
      return Array.isArray(condition.value) ? condition.value.includes(actual) : false;
    default:
      return true;
  }
}

function evaluateConditions(payload: AutomationPayload, conditions: WorkflowCondition[]): boolean {
  return conditions.every((condition) => evaluateCondition(payload, condition));
}

function resolveRecipientIds(payload: AutomationPayload, recipientField: string): string[] {
  const value = getByPath(payload, recipientField);

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (isRecord(value) && typeof value.userId === "string" && value.userId.trim()) {
    return [value.userId.trim()];
  }

  return [];
}

async function finalizeRun(runId: string, data: {
  status: string;
  summary?: string;
  failureReason?: string | null;
}) {
  return prisma.workflowRun.update({
    where: { id: runId },
    data: {
      status: data.status,
      summary: data.summary,
      failureReason: data.failureReason ?? null,
      finishedAt: new Date()
    }
  });
}

async function executeWorkflowDefinition(
  workflow: Pick<WorkflowDefinition, "id" | "tenantId" | "triggerType" | "conditions" | "actions">,
  payload: AutomationPayload,
  retryCount = 0
): Promise<WorkflowRun> {
  const run = await prisma.workflowRun.create({
    data: {
      tenantId: workflow.tenantId,
      workflowId: workflow.id,
      triggerType: workflow.triggerType,
      retryCount,
      triggerPayload: normalizeJson(payload)
    }
  });

  try {
    const conditions = parseConditions(workflow.conditions);
    if (!evaluateConditions(payload, conditions)) {
      return finalizeRun(run.id, {
        status: "skipped",
        summary: "لم تتحقق شروط تنفيذ الـ workflow"
      });
    }

    const actions = parseActions(workflow.actions);
    if (actions.length === 0) {
      return finalizeRun(run.id, {
        status: "skipped",
        summary: "لا توجد إجراءات صالحة للتنفيذ"
      });
    }

    let successCount = 0;
    let skippedCount = 0;
    let failureCount = 0;

    for (const action of actions) {
      if (action.type !== "notification") {
        skippedCount += 1;
        await prisma.workflowActionLog.create({
          data: {
            runId: run.id,
            actionType: action.type,
            status: "skipped",
            summary: "نوع الإجراء غير مدعوم حالياً"
          }
        });
        continue;
      }

      const recipientIds = resolveRecipientIds(payload, action.recipientField);
      if (recipientIds.length === 0) {
        skippedCount += 1;
        await prisma.workflowActionLog.create({
          data: {
            runId: run.id,
            actionType: action.type,
            status: "skipped",
            summary: `لم يتم العثور على مستلمين في ${action.recipientField}`
          }
        });
        continue;
      }

      try {
        await sendBulkNotification(
          recipientIds.map((userId) => ({
            tenantId: workflow.tenantId,
            userId,
            type: action.notificationType ?? "general",
            title: interpolateTemplate(action.title, payload) ?? action.title,
            message: interpolateTemplate(action.message, payload) ?? action.message,
            link: interpolateTemplate(action.link, payload),
            metadata: payload
          }))
        );

        successCount += 1;
        await prisma.workflowActionLog.create({
          data: {
            runId: run.id,
            actionType: action.type,
            status: "success",
            summary: `تم إرسال ${recipientIds.length} إشعار`,
            output: normalizeJson({ recipientIds, count: recipientIds.length })
          }
        });
      } catch (error) {
        failureCount += 1;
        await prisma.workflowActionLog.create({
          data: {
            runId: run.id,
            actionType: action.type,
            status: "failed",
            summary: "فشل تنفيذ الإجراء",
            errorMessage: error instanceof Error ? error.message : "Unknown workflow action error"
          }
        });
      }
    }

    if (failureCount > 0 && successCount === 0) {
      return finalizeRun(run.id, {
        status: "failed",
        summary: "فشل تنفيذ جميع الإجراءات",
        failureReason: "All workflow actions failed"
      });
    }

    if (failureCount > 0) {
      return finalizeRun(run.id, {
        status: "partial",
        summary: `نجح ${successCount} وفشل ${failureCount}`,
        failureReason: `${failureCount} action(s) failed`
      });
    }

    if (successCount === 0 && skippedCount > 0) {
      return finalizeRun(run.id, {
        status: "skipped",
        summary: "تم تخطي جميع الإجراءات"
      });
    }

    return finalizeRun(run.id, {
      status: "success",
      summary: `تم تنفيذ ${successCount} إجراء بنجاح`
    });
  } catch (error) {
    await prisma.workflowActionLog.create({
      data: {
        runId: run.id,
        actionType: "engine",
        status: "failed",
        summary: "فشل محرك الأتمتة قبل إنهاء التنفيذ",
        errorMessage: error instanceof Error ? error.message : "Unknown workflow engine error"
      }
    });

    return finalizeRun(run.id, {
      status: "failed",
      summary: "فشل تنفيذ الـ workflow",
      failureReason: error instanceof Error ? error.message : "Unknown workflow engine error"
    });
  }
}

export async function ensureDefaultWorkflows(tenantId: string): Promise<void> {
  await Promise.all(
    DEFAULT_WORKFLOWS.map((workflow) =>
      prisma.workflowDefinition.upsert({
        where: { tenantId_key: { tenantId, key: workflow.key } },
        update: {
          name: workflow.name,
          description: workflow.description,
          triggerType: workflow.triggerType,
          scope: "tenant",
          version: 1,
          isBuiltin: true,
          conditions: normalizeJson(workflow.conditions ?? []),
          actions: normalizeJson(workflow.actions)
        },
        create: {
          tenantId,
          key: workflow.key,
          name: workflow.name,
          description: workflow.description,
          triggerType: workflow.triggerType,
          scope: "tenant",
          version: 1,
          enabled: true,
          isBuiltin: true,
          conditions: normalizeJson(workflow.conditions ?? []),
          actions: normalizeJson(workflow.actions)
        }
      })
    )
  );
}

export async function triggerWorkflowEvent(
  tenantId: string,
  triggerType: AutomationTriggerType,
  payload: AutomationPayload
): Promise<void> {
  await ensureDefaultWorkflows(tenantId);

  const workflows = await prisma.workflowDefinition.findMany({
    where: { tenantId, triggerType, enabled: true },
    select: {
      id: true,
      tenantId: true,
      triggerType: true,
      conditions: true,
      actions: true
    }
  });

  if (workflows.length === 0) return;

  await Promise.allSettled(
    workflows.map((workflow) => executeWorkflowDefinition(workflow, payload))
  );
}

export async function retryWorkflowRun(tenantId: string, workflowId: string, runId: string) {
  const originalRun = await prisma.workflowRun.findFirst({
    where: { id: runId, workflowId, tenantId },
    select: {
      id: true,
      retryCount: true,
      triggerPayload: true,
      workflow: {
        select: {
          id: true,
          tenantId: true,
          triggerType: true,
          conditions: true,
          actions: true,
          enabled: true
        }
      }
    }
  });

  if (!originalRun) {
    throw new Error("Workflow run not found");
  }

  if (!originalRun.workflow.enabled) {
    throw new Error("Workflow is disabled");
  }

  const payload = isRecord(originalRun.triggerPayload)
    ? originalRun.triggerPayload
    : {};

  return executeWorkflowDefinition(originalRun.workflow, payload, originalRun.retryCount + 1);
}

export async function getAutomationDashboard(tenantId: string): Promise<AutomationDashboardData> {
  await ensureDefaultWorkflows(tenantId);

  const [workflows, runs] = await Promise.all([
    prisma.workflowDefinition.findMany({
      where: { tenantId },
      orderBy: [{ isBuiltin: "desc" }, { triggerType: "asc" }, { name: "asc" }],
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        triggerType: true,
        enabled: true,
        isBuiltin: true,
        version: true,
        conditions: true,
        actions: true,
        updatedAt: true,
        runs: {
          orderBy: { startedAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            summary: true,
            retryCount: true,
            startedAt: true,
            finishedAt: true
          }
        }
      }
    }),
    prisma.workflowRun.findMany({
      where: { tenantId },
      orderBy: { startedAt: "desc" },
      take: 20,
      select: {
        id: true,
        workflowId: true,
        triggerType: true,
        status: true,
        summary: true,
        failureReason: true,
        retryCount: true,
        startedAt: true,
        finishedAt: true,
        workflow: { select: { name: true } }
      }
    })
  ]);

  return {
    workflows: workflows.map((workflow) => ({
      id: workflow.id,
      key: workflow.key,
      name: workflow.name,
      description: workflow.description,
      triggerType: workflow.triggerType,
      enabled: workflow.enabled,
      isBuiltin: workflow.isBuiltin,
      version: workflow.version,
      conditionsCount: Array.isArray(workflow.conditions) ? workflow.conditions.length : 0,
      actionsCount: Array.isArray(workflow.actions) ? workflow.actions.length : 0,
      updatedAt: workflow.updatedAt.toISOString(),
      latestRun: workflow.runs[0]
        ? {
            id: workflow.runs[0].id,
            status: workflow.runs[0].status,
            summary: workflow.runs[0].summary ?? null,
            retryCount: workflow.runs[0].retryCount,
            startedAt: workflow.runs[0].startedAt.toISOString(),
            finishedAt: workflow.runs[0].finishedAt?.toISOString() ?? null
          }
        : null
    })),
    runs: runs.map((run) => ({
      id: run.id,
      workflowId: run.workflowId,
      workflowName: run.workflow.name,
      triggerType: run.triggerType,
      status: run.status,
      summary: run.summary ?? null,
      failureReason: run.failureReason ?? null,
      retryCount: run.retryCount,
      startedAt: run.startedAt.toISOString(),
      finishedAt: run.finishedAt?.toISOString() ?? null
    }))
  };
}