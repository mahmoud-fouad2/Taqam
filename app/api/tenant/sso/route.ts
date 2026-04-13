/**
 * Tenant SSO Settings API
 * PATCH /api/tenant/sso  → save SSO config into tenant.settings.sso
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenantSession, logApiError } from "@/lib/api/route-helper";
import prisma from "@/lib/db";

const ssoProviderConfigSchema = z.object({
  sso: z.object({
    entraId: z.object({
      tenantId: z.string().max(200).optional(),
      clientId: z.string().max(200).optional(),
      clientSecret: z.string().max(500).optional(),
      enabled: z.boolean().optional(),
    }).optional(),
    google: z.object({
      clientId: z.string().max(500).optional(),
      clientSecret: z.string().max(500).optional(),
      hostedDomain: z.string().max(100).optional(),
      enabled: z.boolean().optional(),
    }).optional(),
    saml: z.object({
      metadataUrl: z.string().url().max(1000).optional().or(z.literal("")),
      entityId: z.string().max(1000).optional(),
      acsUrl: z.string().max(1000).optional(),
      enabled: z.boolean().optional(),
    }).optional(),
  }),
});

export async function PATCH(req: NextRequest) {
  try {
    const result = await requireTenantSession(req);
    if (!result.ok) return result.response;
    const { tenantId, session } = result;

    // Only TENANT_ADMIN may configure SSO
    if (session.user.role !== "TENANT_ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = ssoProviderConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" }, { status: 400 });
    }

    const { sso } = parsed.data;

    // Merge into existing settings (preserve other settings keys)
    const current = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    const existingSettings = (current?.settings as Record<string, unknown> | null) ?? {};
    const updatedSettings = { ...existingSettings, sso };

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: updatedSettings },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logApiError("PATCH /api/tenant/sso error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
