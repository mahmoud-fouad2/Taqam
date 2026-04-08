import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { requireMobileAuthWithDevice } from "@/lib/mobile/auth";
import { getMobileDeviceHeaders } from "@/lib/mobile/device";

const schema = z.object({
  token: z.string().min(1).max(500),
});

export async function POST(request: NextRequest) {
  const payloadOrRes = await requireMobileAuthWithDevice(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  try {
    const raw = await request.json();
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const deviceId = getMobileDeviceHeaders(request).deviceId;

    await prisma.mobileDevice.updateMany({
      where: { userId: payloadOrRes.userId, deviceId },
      data: {
        pushToken: parsed.data.token,
        pushTokenUpdatedAt: new Date(),
      },
    });

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error("Mobile push-token POST error:", error);
    return NextResponse.json({ error: "Failed to update push token" }, { status: 500 });
  }
}
