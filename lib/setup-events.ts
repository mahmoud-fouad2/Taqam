import { z } from "zod";

const SETUP_EVENT_MAX_STEP = 5;

export const setupTrackedEventSchema = z.discriminatedUnion("event", [
  z.object({
    event: z.literal("setup_step_viewed"),
    phase: z.literal("wizard"),
    currentStep: z.number().int().min(1).max(SETUP_EVENT_MAX_STEP),
    totalSteps: z.number().int().min(1).max(SETUP_EVENT_MAX_STEP)
  }),
  z.object({
    event: z.literal("setup_checklist_viewed"),
    phase: z.literal("checklist"),
    currentStep: z.number().int().min(1).max(SETUP_EVENT_MAX_STEP),
    totalSteps: z.number().int().min(1).max(SETUP_EVENT_MAX_STEP)
  }),
  z.object({
    event: z.literal("setup_done_viewed"),
    phase: z.literal("done"),
    currentStep: z.number().int().min(1).max(SETUP_EVENT_MAX_STEP),
    totalSteps: z.number().int().min(1).max(SETUP_EVENT_MAX_STEP)
  })
]);

export type SetupTrackedEventInput = z.infer<typeof setupTrackedEventSchema>;

export function parseSetupTrackedEventInput(input: unknown) {
  const parsed = setupTrackedEventSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      error: "بيانات حدث التفعيل غير صالحة",
      issues: parsed.error.issues
    };
  }

  return {
    ok: true as const,
    data: parsed.data
  };
}

export function getSetupTrackedEventAuditAction(event: SetupTrackedEventInput["event"]) {
  if (event === "setup_checklist_viewed") {
    return "SETUP_CHECKLIST_VIEWED";
  }

  if (event === "setup_done_viewed") {
    return "SETUP_DONE_VIEWED";
  }

  return "SETUP_STEP_VIEWED";
}

export function getSetupTrackedEventCompletionPercent(input: SetupTrackedEventInput) {
  return Math.round((input.currentStep / input.totalSteps) * 100);
}