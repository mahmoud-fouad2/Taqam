import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { normalizePublicJobType } from "@/lib/recruitment/public-meta";
import { listPublicJobFilters, listPublicJobPostings } from "@/lib/recruitment/public";

const listQuerySchema = z.object({
  tenantSlug: z.string().min(2).optional(),
  query: z.string().min(1).optional(),
  q: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  jobType: z.string().min(1).optional(),
  limit: z.coerce.number().int().positive().max(60).default(24).catch(24),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = listQuerySchema.safeParse({
      tenantSlug: searchParams.get("tenantSlug") ?? undefined,
      query: searchParams.get("query") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      location: searchParams.get("location") ?? undefined,
      department: searchParams.get("department") ?? undefined,
      jobType: searchParams.get("jobType") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    const query = parsed.data.query ?? parsed.data.q;
    const filters = await listPublicJobFilters({ tenantSlug: parsed.data.tenantSlug });
    const jobs = await listPublicJobPostings({
      tenantSlug: parsed.data.tenantSlug,
      query,
      location: parsed.data.location,
      departmentId: parsed.data.department,
      jobType: normalizePublicJobType(parsed.data.jobType),
      limit: parsed.data.limit,
    });

    return NextResponse.json({
      data: {
        items: jobs,
        total: jobs.length,
        filters,
      },
    });
  } catch (error) {
    console.error("GET public job postings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}