import { NextRequest, NextResponse } from "next/server";
import { verifyMobileAccessToken, type MobileTokenPayload } from "@/lib/mobile/jwt";
import { getMobileDeviceHeaders } from "@/lib/mobile/device";

export async function getMobileAuthPayload(
  request: NextRequest
): Promise<MobileTokenPayload | null> {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header) return null;

  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  try {
    return await verifyMobileAccessToken(match[1]);
  } catch {
    return null;
  }
}

export async function requireMobileAuth(
  request: NextRequest
): Promise<MobileTokenPayload | NextResponse> {
  const payload = await getMobileAuthPayload(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return payload;
}

export async function requireMobileAuthWithDevice(
  request: NextRequest
): Promise<(MobileTokenPayload & { deviceId: string }) | NextResponse> {
  const payloadOrRes = await requireMobileAuth(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  let headerDeviceId: string;
  try {
    headerDeviceId = getMobileDeviceHeaders(request).deviceId;
  } catch {
    return NextResponse.json({ error: "Missing device" }, { status: 400 });
  }

  if (payloadOrRes.deviceId !== headerDeviceId) {
    return NextResponse.json({ error: "Device mismatch" }, { status: 401 });
  }

  return payloadOrRes;
}

export async function requireMobileEmployeeAuthWithDevice(
  request: NextRequest
): Promise<
  (MobileTokenPayload & { deviceId: string; tenantId: string; employeeId: string }) | NextResponse
> {
  const payloadOrRes = await requireMobileAuthWithDevice(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  if (!payloadOrRes.tenantId) {
    return NextResponse.json({ error: "Tenant required" }, { status: 400 });
  }

  if (!payloadOrRes.employeeId) {
    return NextResponse.json({ error: "هذا التطبيق مخصص للموظفين فقط" }, { status: 403 });
  }

  return {
    ...payloadOrRes,
    tenantId: payloadOrRes.tenantId,
    employeeId: payloadOrRes.employeeId
  };
}
