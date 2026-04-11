import { NextRequest, NextResponse } from "next/server";

export const MOBILE_REFRESH_COOKIE = "taqam_mrt";
const LEGACY_MOBILE_REFRESH_COOKIE = "ujoor_mrt";

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

function getMobileCookieOptions(opts?: { expiresAt?: Date }) {
  return {
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax" as const,
    path: "/api/mobile/auth",
    ...(opts?.expiresAt ? { expires: opts.expiresAt } : {})
  };
}

export function getMobileRefreshCookie(request: NextRequest): string | null {
  return (
    request.cookies.get(MOBILE_REFRESH_COOKIE)?.value ??
    request.cookies.get(LEGACY_MOBILE_REFRESH_COOKIE)?.value ??
    null
  );
}

export function setMobileRefreshCookie(
  res: NextResponse,
  refreshToken: string,
  opts?: { expiresAt?: Date }
) {
  res.cookies.set(MOBILE_REFRESH_COOKIE, refreshToken, getMobileCookieOptions(opts));
  res.cookies.set(LEGACY_MOBILE_REFRESH_COOKIE, "", {
    ...getMobileCookieOptions(),
    expires: new Date(0)
  });
}

export function clearMobileRefreshCookie(res: NextResponse) {
  res.cookies.set(MOBILE_REFRESH_COOKIE, "", {
    ...getMobileCookieOptions(),
    expires: new Date(0)
  });
  res.cookies.set(LEGACY_MOBILE_REFRESH_COOKIE, "", {
    ...getMobileCookieOptions(),
    expires: new Date(0)
  });
}
