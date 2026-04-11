import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isR2Configured, uploadFile } from "@/lib/r2-storage";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
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

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!isR2Configured()) {
      const uploadsDir = path.join(process.cwd(), "public", ".tmp-tenant-logos");
      const ext = path.extname(file.name) || ".bin";
      const safeExt = ext.replace(/[^.a-zA-Z0-9]/g, "") || ".bin";
      const fileName = `${Date.now()}-${randomUUID()}${safeExt}`;

      await mkdir(uploadsDir, { recursive: true });
      await writeFile(path.join(uploadsDir, fileName), buffer);

      return NextResponse.json(
        {
          success: true,
          data: {
            key: fileName,
            url: `/.tmp-tenant-logos/${fileName}`,
            storage: "local"
          }
        },
        { status: 201 }
      );
    }

    const upload = await uploadFile(buffer, file.name, file.type, "platform", "tenant-logos");

    if (!upload.success || !upload.url) {
      return NextResponse.json({ error: upload.error || "Upload failed" }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          key: upload.key,
          url: upload.url,
          storage: "r2"
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading tenant logo:", error);
    return NextResponse.json({ error: "Failed to upload tenant logo" }, { status: 500 });
  }
}
