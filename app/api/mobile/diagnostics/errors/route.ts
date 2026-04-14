import { NextRequest, NextResponse } from "next/server";

import { createAuditLog, getRequestMetadata } from "@/lib/audit/logger";
import { logger } from "@/lib/logger";
import {
  buildMobileDiagnosticsAuditPayload,
  getMobileDiagnosticsAuditAction,
  parseMobileDiagnosticsReport
} from "@/lib/mobile-diagnostics";
import { getMobileAuthPayload } from "@/lib/mobile/auth";
import { getMobileDeviceHeaders } from "@/lib/mobile/device";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  let deviceHeaders;

  try {
    deviceHeaders = getMobileDeviceHeaders(request);
  } catch {
    return NextResponse.json({ error: "Missing device" }, { status: 400 });
  }

  const limitInfo = await checkRateLimit(request, {
    keyPrefix: "mobile-diagnostics",
    limit: 12,
    windowMs: 5 * 60 * 1000,
    identifier: deviceHeaders.deviceId
  });

  if (!limitInfo.allowed) {
    return withRateLimitHeaders(
      NextResponse.json({ error: "Too many diagnostics reports" }, { status: 429 }),
      limitInfo
    );
  }

  try {
    const authPayload = await getMobileAuthPayload(request);

    if (authPayload && authPayload.deviceId !== deviceHeaders.deviceId) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Device mismatch" }, { status: 401 }),
        limitInfo
      );
    }

    const raw = await request.json();
    const parsed = parseMobileDiagnosticsReport(raw);

    if (!parsed.ok) {
      return withRateLimitHeaders(
        NextResponse.json({ error: parsed.error }, { status: 400 }),
        limitInfo
      );
    }

    const metadata = getRequestMetadata(request);

    await createAuditLog({
      tenantId: authPayload?.tenantId ?? null,
      userId: authPayload?.userId ?? null,
      action: getMobileDiagnosticsAuditAction(parsed.data.severity),
      entity: "MobileApp",
      entityId: deviceHeaders.deviceId,
      newData: buildMobileDiagnosticsAuditPayload({
        report: parsed.data,
        device: deviceHeaders,
        role: authPayload?.role ?? null,
        employeeId: authPayload?.employeeId ?? null
      }),
      ipAddress: metadata.ipAddress,
      userAgent: deviceHeaders.userAgent ?? metadata.userAgent
    });

    return withRateLimitHeaders(NextResponse.json({ data: { ok: true } }), limitInfo);
  } catch (error) {
    logger.error("Mobile diagnostics POST error", undefined, error);
    return withRateLimitHeaders(
      NextResponse.json({ error: "Failed to record diagnostics" }, { status: 500 }),
      limitInfo
    );
  }
}