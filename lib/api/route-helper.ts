/**
 * API Route Helper
 * مساعد موحد للتحقق من المصادقة في API Routes
 * يلغي تكرار 6-8 أسطر في كل route
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getTenantAccessMessage, validateTenantAccess } from "@/lib/tenant-access";

export type AuthenticatedSession = {
  user: {
    id: string;
    email: string;
    role: string;
    tenantId: string | null | undefined;
    firstName: string;
    lastName: string;
    permissions: string[];
  };
};

type RouteResult =
  | { ok: true; session: AuthenticatedSession; tenantId: string }
  | { ok: false; response: NextResponse };

type TenantRouteResult =
  | { ok: true; session: AuthenticatedSession; tenantId: string }
  | { ok: false; response: NextResponse };

type TenantOrSuperAdminRouteResult =
  | { ok: true; session: AuthenticatedSession; tenantId: string | null; isSuperAdmin: boolean }
  | { ok: false; response: NextResponse };

function isSuperAdminRole(role: string | undefined) {
  return role === "SUPER_ADMIN";
}

/**
 * Verify session exists — for routes that don't require a tenant
 */
export async function requireSession(
  _req?: NextRequest
): Promise<{ ok: true; session: AuthenticatedSession } | { ok: false; response: NextResponse }> {
  const session = (await getServerSession(authOptions)) as AuthenticatedSession | null;

  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    };
  }

  return { ok: true, session };
}

/**
 * Verify session AND require a tenantId — for all tenant-scoped routes
 */
export async function requireTenantSession(req?: NextRequest): Promise<TenantRouteResult> {
  const sessionResult = await requireSession(req);
  if (!sessionResult.ok) return sessionResult;

  const { session } = sessionResult;
  const tenantId = session.user.tenantId;

  if (!tenantId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Tenant context required" }, { status: 400 })
    };
  }

  const tenantAccess = await validateTenantAccess(tenantId);
  if (!tenantAccess.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: getTenantAccessMessage(tenantAccess.issue, "ar"),
          code: tenantAccess.issue.toUpperCase()
        },
        { status: 403 }
      )
    };
  }

  return { ok: true, session, tenantId };
}

/**
 * Verify session and tenant access, while still allowing super admins.
 */
export async function requireTenantOrSuperAdminSession(
  req?: NextRequest
): Promise<TenantOrSuperAdminRouteResult> {
  const sessionResult = await requireSession(req);
  if (!sessionResult.ok) return sessionResult;

  const { session } = sessionResult;

  if (isSuperAdminRole(session.user.role)) {
    return {
      ok: true,
      session,
      tenantId: session.user.tenantId ?? null,
      isSuperAdmin: true
    };
  }

  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Tenant context required" }, { status: 400 })
    };
  }

  const tenantAccess = await validateTenantAccess(tenantId);
  if (!tenantAccess.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: getTenantAccessMessage(tenantAccess.issue, "ar"),
          code: tenantAccess.issue.toUpperCase()
        },
        { status: 403 }
      )
    };
  }

  return { ok: true, session, tenantId, isSuperAdmin: false };
}

/**
 * Verify session AND require one of the given roles
 */
export async function requireRole(
  req: NextRequest | undefined,
  allowedRoles: string[]
): Promise<TenantRouteResult> {
  const result = await requireTenantSession(req);
  if (!result.ok) return result;

  if (!allowedRoles.includes(result.session.user.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 })
    };
  }

  return result;
}

/**
 * Safe pagination parser — prevents limit=99999 attacks
 */
export function parsePagination(searchParams: URLSearchParams, maxLimit = 100) {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20)
  );
  return { page, limit, skip: (page - 1) * limit };
}

export function dataResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function nullDataResponse(status = 200) {
  return dataResponse(null, status);
}

export function errorResponse(message: string, status = 500, extra?: Record<string, unknown>) {
  return NextResponse.json(extra ? { error: message, ...extra } : { error: message }, { status });
}

export function unauthorizedResponse(message = "Unauthorized") {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message = "Forbidden") {
  return errorResponse(message, 403);
}

export function notFoundResponse(message = "Not found") {
  return errorResponse(message, 404);
}

export function validationErrorResponse(details: unknown, message = "Invalid input") {
  return errorResponse(message, 400, { details });
}

export function logApiError(message: string, error: unknown, meta?: Record<string, unknown>) {
  logger.error(message, meta, error);
}

/**
 * Standard success response
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Standard error response
 */
export function apiError(message: string, status = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}
