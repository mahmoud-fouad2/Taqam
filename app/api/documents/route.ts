/**
 * Documents API Routes with R2 Upload
 */

import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isR2Configured, uploadFile } from "@/lib/r2-storage";

type PrismaDocumentCategory =
  | "PERSONAL"
  | "EMPLOYMENT"
  | "EDUCATIONAL"
  | "MEDICAL"
  | "FINANCIAL"
  | "LEGAL"
  | "OTHER";

function normalizeDocumentCategory(value: string): PrismaDocumentCategory | null {
  const upper = value.trim().toUpperCase();
  // Allow Prisma enum values directly
  if (
    upper === "PERSONAL" ||
    upper === "EMPLOYMENT" ||
    upper === "EDUCATIONAL" ||
    upper === "MEDICAL" ||
    upper === "FINANCIAL" ||
    upper === "LEGAL" ||
    upper === "OTHER"
  ) {
    return upper as PrismaDocumentCategory;
  }

  // Map UI lowercase values
  switch (value.trim().toLowerCase()) {
    case "personal":
      return "PERSONAL";
    case "employment":
      return "EMPLOYMENT";
    case "education":
      return "EDUCATIONAL";
    case "medical":
      return "MEDICAL";
    case "financial":
      return "FINANCIAL";
    case "legal":
      return "LEGAL";
    case "other":
      return "OTHER";
    default:
      return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const category = searchParams.get("category");

    const where: any = {};

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (category) {
      const normalized = normalizeDocumentCategory(category);
      if (!normalized) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
      where.category = normalized;
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ data: documents });
  } catch (error) {
    logApiError("Error fetching documents", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const userId = session.user.id;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    if (!isR2Configured()) {
      return NextResponse.json({ error: "Document storage is not configured" }, { status: 503 });
    }

    const formData = (await request.formData()) as unknown as globalThis.FormData;
    const file = formData.get("file") as File;
    const employeeId = formData.get("employeeId") as string;
    const title = formData.get("title") as string;
    const titleAr = formData.get("titleAr") as string | null;
    const categoryRaw = formData.get("category") as string;
    const description = formData.get("description") as string | null;
    const expiryDate = formData.get("expiryDate") as string | null;

    const category = categoryRaw ? normalizeDocumentCategory(categoryRaw) : null;

    if (!file || !employeeId || !title || !category) {
      return NextResponse.json(
        { error: "File, employee, title, and category are required" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const upload = await uploadFile(
      buffer,
      file.name,
      file.type,
      tenantId,
      `documents/${employeeId}`
    );

    if (!upload.success || !upload.key || !upload.url) {
      return NextResponse.json(
        { error: upload.error || "Failed to upload document" },
        { status: 500 }
      );
    }

    // Create document record
    const document = await prisma.document.create({
      data: {
        tenantId,
        employeeId,
        uploadedById: userId,
        fileName: upload.key,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: upload.url,
        title,
        titleAr,
        category,
        description,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: "PENDING"
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json({ data: document }, { status: 201 });
  } catch (error) {
    logApiError("Error uploading document", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
