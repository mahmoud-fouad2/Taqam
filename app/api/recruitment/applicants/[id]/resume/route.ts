import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/db";
import { errorResponse, requireRole } from "@/lib/api/route-helper";
import { getSignedDownloadUrl, headFile } from "@/lib/r2-storage";

type RouteContext = { params: Promise<{ id: string }> };

const RECRUITMENT_RESUME_ROLES = ["TENANT_ADMIN", "HR_MANAGER"];
const SIGNED_URL_TTL_SECONDS = 10 * 60;

function noStoreJson(message: string, status = 500) {
  const res = errorResponse(message, status);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

function noStoreRedirect(url: string) {
  const res = NextResponse.redirect(url);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

function trimTrailingSlashes(value: string) {
  return value.replace(/\/+$/g, "");
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireRole(request, RECRUITMENT_RESUME_ROLES);
  if (!auth.ok) return auth.response;
  const { tenantId } = auth;

  const { id } = await context.params;

  const applicant = await prisma.applicant.findFirst({
    where: { id, tenantId },
    select: { id: true, resumeUrl: true }
  });

  const resumeRef = applicant?.resumeUrl?.trim();
  if (!resumeRef) {
    return noStoreJson("Resume not found", 404);
  }

  // Legacy support: If DB stores a full URL, either extract the R2 key (if it is our public URL)
  // or redirect to the URL (http/https only).
  if (resumeRef.startsWith("http://") || resumeRef.startsWith("https://")) {
    const publicBase = process.env.R2_PUBLIC_URL
      ? trimTrailingSlashes(process.env.R2_PUBLIC_URL)
      : "";

    if (publicBase && resumeRef.startsWith(`${publicBase}/`)) {
      const key = resumeRef.slice(publicBase.length + 1);
      const meta = await headFile(key);
      if (!meta) return noStoreJson("Resume not found", 404);

      const signedUrl = await getSignedDownloadUrl(key, SIGNED_URL_TTL_SECONDS);
      if (!signedUrl) return noStoreJson("Failed to generate download link", 500);

      return noStoreRedirect(signedUrl);
    }

    try {
      const url = new URL(resumeRef);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return noStoreJson("Invalid resume URL", 400);
      }
      return noStoreRedirect(url.toString());
    } catch {
      return noStoreJson("Invalid resume URL", 400);
    }
  }

  // New flow: DB stores the R2 key directly.
  const key = resumeRef;

  // Prevent cross-tenant key usage even if DB was tampered.
  if (!key.startsWith(`${tenantId}/`)) {
    return noStoreJson("Forbidden", 403);
  }

  const meta = await headFile(key);
  if (!meta) return noStoreJson("Resume not found", 404);

  const signedUrl = await getSignedDownloadUrl(key, SIGNED_URL_TTL_SECONDS);
  if (!signedUrl) return noStoreJson("Failed to generate download link", 500);

  return noStoreRedirect(signedUrl);
}
