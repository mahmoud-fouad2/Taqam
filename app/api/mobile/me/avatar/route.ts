import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireMobileEmployeeAuthWithDevice } from "@/lib/mobile/auth";
import { isR2Configured, uploadFile } from "@/lib/r2-storage";

export async function POST(request: NextRequest) {
  const payloadOrRes = await requireMobileEmployeeAuthWithDevice(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  try {
    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    if (file.size > 3 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    if (!isR2Configured()) {
      return NextResponse.json({ error: "Avatar storage is not configured" }, { status: 503 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadFile(buffer, file.name, file.type, payloadOrRes.tenantId, "avatars");
    if (!result.success || !result.url) {
      return NextResponse.json({ error: result.error || "Upload failed" }, { status: 500 });
    }

    await prisma.user.update({
      where: { id: payloadOrRes.userId },
      data: { avatar: result.url },
      select: { id: true }
    });

    return NextResponse.json({ data: { url: result.url } });
  } catch (error) {
    logger.error("Mobile avatar upload error", undefined, error);
    return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
  }
}
