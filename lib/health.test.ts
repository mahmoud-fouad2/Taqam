import { describe, expect, it } from "vitest";

import { deriveSystemHealthSnapshot, toPublicSystemHealthSnapshot } from "@/lib/health";
import type { RuntimeIntegrationReport } from "@/lib/runtime-integrations";

function createRuntimeReport(partial: number, missing: number): RuntimeIntegrationReport {
  return {
    items: [],
    summary: {
      total: 4,
      configured: 4 - partial - missing,
      partial,
      missing
    }
  };
}

describe("deriveSystemHealthSnapshot", () => {
  it("returns ok when database is connected and runtime integrations are fully configured", () => {
    const snapshot = deriveSystemHealthSnapshot({
      databaseStatus: "connected",
      runtimeReport: createRuntimeReport(0, 0),
      timestamp: new Date("2026-04-14T00:00:00.000Z"),
      uptimeSeconds: 120
    });

    expect(snapshot.status).toBe("ok");
    expect(snapshot.httpStatus).toBe(200);
  });

  it("returns degraded when database is connected but runtime integrations are partial or missing", () => {
    const snapshot = deriveSystemHealthSnapshot({
      databaseStatus: "connected",
      runtimeReport: createRuntimeReport(1, 1)
    });

    expect(snapshot.status).toBe("degraded");
    expect(snapshot.httpStatus).toBe(200);
  });

  it("returns error when the database is unavailable", () => {
    const snapshot = deriveSystemHealthSnapshot({
      databaseStatus: "error",
      runtimeReport: createRuntimeReport(0, 0)
    });

    expect(snapshot.status).toBe("error");
    expect(snapshot.httpStatus).toBe(503);
  });

  it("strips sensitive runtime details from the public health snapshot", () => {
    const snapshot = deriveSystemHealthSnapshot({
      databaseStatus: "connected",
      runtimeReport: {
        summary: {
          total: 1,
          configured: 0,
          partial: 1,
          missing: 0
        },
        items: [
          {
            id: "email",
            name: "SMTP email",
            configured: false,
            mode: "partial",
            missing: ["SMTP_PASSWORD"],
            features: ["password reset"]
          }
        ]
      }
    });

    expect(toPublicSystemHealthSnapshot(snapshot)).toEqual({
      status: "degraded",
      httpStatus: 200,
      timestamp: snapshot.timestamp,
      uptimeSeconds: snapshot.uptimeSeconds,
      database: {
        status: "connected"
      },
      runtime: {
        summary: {
          total: 1,
          configured: 0,
          partial: 1,
          missing: 0
        },
        items: [
          {
            id: "email",
            name: "SMTP email",
            mode: "partial"
          }
        ]
      }
    });
  });
});
