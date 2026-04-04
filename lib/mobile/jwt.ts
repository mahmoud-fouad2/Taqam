import { SignJWT, jwtVerify } from "jose";

export type MobileTokenPayload = {
  userId: string;
  tenantId: string | null;
  role: string;
  employeeId: string | null;
  deviceId: string;
};

let warnedMissingMobileJwtSecret = false;

function getSecret(): Uint8Array {
  const explicit = process.env.MOBILE_JWT_SECRET;
  if (explicit) return new TextEncoder().encode(explicit);

  const isProd = process.env.NODE_ENV === "production";
  if (isProd) throw new Error("MOBILE_JWT_SECRET is not set");

  const fallback =
    process.env.NEXTAUTH_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.JWT_SECRET ??
    "dev-mobile-jwt-secret";

  if (!warnedMissingMobileJwtSecret) {
    warnedMissingMobileJwtSecret = true;
    console.warn(
      "[mobile] MOBILE_JWT_SECRET is not set; using a development fallback secret (set MOBILE_JWT_SECRET to silence this)."
    );
  }

  return new TextEncoder().encode(fallback);
}

export async function issueMobileAccessToken(payload: MobileTokenPayload, opts?: { ttlSeconds?: number }) {
  const ttlSeconds = opts?.ttlSeconds ?? 60 * 60 * 8; // 8 hours
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    userId: payload.userId,
    tenantId: payload.tenantId,
    role: payload.role,
    employeeId: payload.employeeId,
    deviceId: payload.deviceId,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .sign(getSecret());
}

export async function verifyMobileAccessToken(token: string): Promise<MobileTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: ["HS256"],
  });

  const userId = typeof payload.userId === "string" ? payload.userId : null;
  const tenantId = typeof payload.tenantId === "string" ? payload.tenantId : null;
  const role = typeof payload.role === "string" ? payload.role : null;
  const employeeId = typeof payload.employeeId === "string" ? payload.employeeId : null;
  const deviceId = typeof payload.deviceId === "string" ? payload.deviceId : null;

  if (!userId || !role || !deviceId) {
    throw new Error("Invalid token payload");
  }

  return { userId, tenantId, role, employeeId, deviceId };
}
