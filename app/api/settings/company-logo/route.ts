import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { logApiError, requireRole } from "@/lib/api/route-helper";
import prisma from "@/lib/db";
import { isR2Configured, uploadFile } from "@/lib/r2-storage";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["TENANT_ADMIN", "HR_MANAGER"]);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;

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

    const buffer = Buffer.from(await file.arrayBuffer());

    let logoUrl: string;

    if (!isR2Configured()) {
      const uploadsDir = path.join(process.cwd(), "public", ".tmp-tenant-logos");
      const ext = path.extname(file.name) || ".bin";
      const safeExt = ext.replace(/[^.a-zA-Z0-9]/g, "") || ".bin";
      const fileName = `${Date.now()}-${randomUUID()}${safeExt}`;

      await mkdir(uploadsDir, { recursive: true });
      await writeFile(path.join(uploadsDir, fileName), buffer);
      logoUrl = `/.tmp-tenant-logos/${fileName}`;
    } else {
      const upload = await uploadFile(buffer, file.name, file.type, tenantId, "tenant-logos");

      if (!upload.success || !upload.url) {
        return NextResponse.json({ error: upload.error || "Upload failed" }, { status: 500 });
      }

      logoUrl = upload.url;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true }
    });

    const settingsObj =
      tenant?.settings && typeof tenant.settings === "object" ? (tenant.settings as any) : {};
    const currentSystemSettings =
      settingsObj?.systemSettings && typeof settingsObj.systemSettings === "object"
        ? settingsObj.systemSettings
        : {};

    const nextSettings = {
      ...settingsObj,
      systemSettings: {
        ...currentSystemSettings,
        general: {
          ...(currentSystemSettings.general ?? {}),
          companyLogo: logoUrl
        }
      }
    };

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        logo: logoUrl,
        settings: nextSettings as Prisma.InputJsonValue
      }
    });

    return NextResponse.json({ data: { url: logoUrl } }, { status: 201 });
  } catch (error) {
    logApiError("Error uploading company logo", error);
    return NextResponse.json({ error: "Failed to upload company logo" }, { status: 500 });
  }
}