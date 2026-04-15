import { describe, expect, it } from "vitest";

import {
  getSetupTrackedEventAuditAction,
  getSetupTrackedEventCompletionPercent,
  parseSetupTrackedEventInput
} from "@/lib/setup-events";

describe("setup tracked events", () => {
  it("accepts step-view events with bounded step values", () => {
    expect(
      parseSetupTrackedEventInput({
        event: "setup_step_viewed",
        phase: "wizard",
        currentStep: 3,
        totalSteps: 5
      })
    ).toEqual({
      ok: true,
      data: {
        event: "setup_step_viewed",
        phase: "wizard",
        currentStep: 3,
        totalSteps: 5
      }
    });
  });

  it("rejects events whose phase does not match the event type", () => {
    const result = parseSetupTrackedEventInput({
      event: "setup_done_viewed",
      phase: "wizard",
      currentStep: 5,
      totalSteps: 5
    });

    expect(result.ok).toBe(false);
  });

  it("maps tracked events to explicit audit actions and progress", () => {
    expect(getSetupTrackedEventAuditAction("setup_checklist_viewed")).toBe(
      "SETUP_CHECKLIST_VIEWED"
    );
    expect(
      getSetupTrackedEventCompletionPercent({
        event: "setup_done_viewed",
        phase: "done",
        currentStep: 5,
        totalSteps: 5
      })
    ).toBe(100);
  });
});
