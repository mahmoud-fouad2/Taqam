/**
 * Profile Avatar Upload API
 * POST /api/profile/avatar - Upload avatar image to R2 and update current user
 */

import { NextRequest, NextResponse } from "next/server";
import { dataResponse, errorResponse, logApiError, requireSession } from "@/lib/api/route-helper";

import prisma from "@/lib/db";
import { isR2Configured, uploadFile } from "@/lib/r2-storage";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.ok) return auth.response;
    const { session } = auth;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // 3MB max (align with client)
    if (file.size > 3 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    if (!isR2Configured()) {
      return NextResponse.json({ error: "Avatar storage is not configured" }, { status: 503 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const tenantId = session.user.tenantId || "platform";

    const result = await uploadFile(buffer, file.name, file.type, tenantId, "avatars");
    if (!result.success || !result.url) {
      return NextResponse.json({ error: result.error || "Upload failed" }, { status: 500 });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: result.url },
      select: { id: true, avatar: true, firstName: true, lastName: true, email: true }
    });

    return dataResponse({ url: updated.avatar, user: updated });
  } catch (error) {
    logApiError("Error uploading avatar", error);
    return errorResponse("Failed to upload avatar");
  }
}
