import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { getPublicJobPostingById } from "@/lib/recruitment/public";
import { isAllowedFileSize, isAllowedFileType, isR2Configured, uploadFile } from "@/lib/r2-storage";

const RATE_LIMIT = {
  limit: 8,
  windowMs: 15 * 60 * 1000,
  keyPrefix: "public-job-resume-upload",
} as const;

const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, RATE_LIMIT);
  if (!rate.allowed) {
    return withRateLimitHeaders(
      NextResponse.json({ error: "Too many requests" }, { status: 429 }),
      { remaining: rate.remaining, resetAt: rate.resetAt, limit: RATE_LIMIT.limit }
    );
  }

  try {
    if (!isR2Configured()) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Resume upload storage is not configured" }, { status: 503 }),
        { remaining: rate.remaining, resetAt: rate.resetAt, limit: RATE_LIMIT.limit }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const jobPostingId = formData.get("jobPostingId");
    const tenantSlug = formData.get("tenantSlug");

    if (!(file instanceof File)) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Missing file" }, { status: 400 }),
        { remaining: rate.remaining, resetAt: rate.resetAt, limit: RATE_LIMIT.limit }
      );
    }

    if (typeof jobPostingId !== "string" || !jobPostingId.trim()) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Missing job posting id" }, { status: 400 }),
        { remaining: rate.remaining, resetAt: rate.resetAt, limit: RATE_LIMIT.limit }
      );
    }

    if (!isAllowedFileType(file.type, ALLOWED_RESUME_TYPES)) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Unsupported file type" }, { status: 400 }),
        { remaining: rate.remaining, resetAt: rate.resetAt, limit: RATE_LIMIT.limit }
      );
    }

    if (!isAllowedFileSize(file.size, 5)) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "File too large" }, { status: 400 }),
        { remaining: rate.remaining, resetAt: rate.resetAt, limit: RATE_LIMIT.limit }
      );
    }

    const job = await getPublicJobPostingById(jobPostingId.trim(), typeof tenantSlug === "string" ? tenantSlug.trim() || undefined : undefined);
    if (!job) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Job posting not found" }, { status: 404 }),
        { remaining: rate.remaining, resetAt: rate.resetAt, limit: RATE_LIMIT.limit }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const upload = await uploadFile(fileBuffer, file.name, file.type, job.tenantId, "career-resumes");

    if (!upload.success || !upload.url) {
      return withRateLimitHeaders(
        NextResponse.json({ error: upload.error || "Resume upload failed" }, { status: 500 }),
        { remaining: rate.remaining, resetAt: rate.resetAt, limit: RATE_LIMIT.limit }
      );
    }

    return withRateLimitHeaders(
      NextResponse.json(
        {
          data: {
            key: upload.key,
            url: upload.url,
            fileName: file.name,
            contentType: file.type,
            size: file.size,
          },
        },
        { status: 201 }
      ),
      { remaining: rate.remaining, resetAt: rate.resetAt, limit: RATE_LIMIT.limit }
    );
  } catch (error) {
    console.error("POST public job resume upload error:", error);
    return withRateLimitHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
      { remaining: rate.remaining, resetAt: rate.resetAt, limit: RATE_LIMIT.limit }
    );
  }
}