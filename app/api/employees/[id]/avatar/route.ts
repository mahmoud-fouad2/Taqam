import { NextRequest, NextResponse } from "next/server";

import { dataResponse, errorResponse, logApiError, requireRole } from "@/lib/api/route-helper";
import prisma from "@/lib/db";
import { isR2Configured, uploadFile } from "@/lib/r2-storage";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRole(request, ["TENANT_ADMIN", "HR_MANAGER"]);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;
    const { id } = await params;

    const employee = await prisma.employee.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null
      },
      select: { id: true }
    });

    if (!employee) {
      return errorResponse("Employee not found", 404);
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
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

    const buffer = Buffer.from(await file.arrayBuffer());
    const upload = await uploadFile(buffer, file.name, file.type, tenantId, "avatars");

    if (!upload.success || !upload.url) {
      return NextResponse.json({ error: upload.error || "Upload failed" }, { status: 500 });
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: { avatar: upload.url },
      select: { id: true, avatar: true }
    });

    return dataResponse({ employee: updated, url: updated.avatar });
  } catch (error) {
    logApiError("Error uploading employee avatar", error);
    return errorResponse("Failed to upload employee avatar");
  }
}