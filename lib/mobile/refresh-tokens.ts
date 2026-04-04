import crypto from "crypto";
import type prisma from "@/lib/db";

type MobileAuthDb = Pick<typeof prisma, "mobileDevice" | "mobileRefreshToken">;

const DEFAULT_REFRESH_TTL_DAYS = 30;

let warnedMissingRefreshSecret = false;

function getRefreshSecret(): string {
  const explicit = process.env.MOBILE_REFRESH_TOKEN_SECRET;
  if (explicit) return explicit;

  const isProd = process.env.NODE_ENV === "production";
  if (isProd) throw new Error("MOBILE_REFRESH_TOKEN_SECRET is not set");

  const fallback =
    process.env.MOBILE_JWT_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.JWT_SECRET ??
    "dev-mobile-refresh-token-secret";

  if (!warnedMissingRefreshSecret) {
    warnedMissingRefreshSecret = true;
    console.warn(
      "[mobile] MOBILE_REFRESH_TOKEN_SECRET is not set; using a development fallback secret (set MOBILE_REFRESH_TOKEN_SECRET to silence this)."
    );
  }

  return fallback;
}

export function hashRefreshToken(rawToken: string): string {
  return crypto.createHmac("sha256", getRefreshSecret()).update(rawToken).digest("base64url");
}

export function issueRawRefreshToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

export function getRefreshTokenExpiryDate(now = new Date()): Date {
  const ttlDays = Number(process.env.MOBILE_REFRESH_TOKEN_TTL_DAYS ?? "");
  const days = Number.isFinite(ttlDays) && ttlDays > 0 ? ttlDays : DEFAULT_REFRESH_TTL_DAYS;
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function upsertMobileDevice(
  prisma: MobileAuthDb,
  input: {
    userId: string;
    deviceId: string;
    platform?: string;
    name?: string;
    appVersion?: string;
  }
) {
  return prisma.mobileDevice.upsert({
    where: { userId_deviceId: { userId: input.userId, deviceId: input.deviceId } },
    create: {
      userId: input.userId,
      deviceId: input.deviceId,
      platform: input.platform,
      name: input.name,
      appVersion: input.appVersion,
      lastSeenAt: new Date(),
    },
    update: {
      platform: input.platform,
      name: input.name,
      appVersion: input.appVersion,
      lastSeenAt: new Date(),
    },
  });
}

export async function mintRefreshToken(
  prisma: MobileAuthDb,
  input: {
    userId: string;
    mobileDeviceId: string;
    userAgent?: string;
    ipAddress?: string;
  }
): Promise<{ refreshToken: string; refreshTokenRecordId: string; expiresAt: Date }> {
  const refreshToken = issueRawRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = getRefreshTokenExpiryDate();

  const record = await prisma.mobileRefreshToken.create({
    data: {
      userId: input.userId,
      mobileDeviceId: input.mobileDeviceId,
      tokenHash,
      expiresAt,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    },
    select: { id: true },
  });

  return { refreshToken, refreshTokenRecordId: record.id, expiresAt };
}

export async function rotateRefreshToken(
  prisma: MobileAuthDb,
  input: {
    rawRefreshToken: string;
    deviceId: string;
    userAgent?: string;
    ipAddress?: string;
  }
): Promise<
  | { ok: true; userId: string; mobileDeviceId: string; refreshToken: string; expiresAt: Date }
  | { ok: false; reason: "invalid" | "revoked" | "expired" | "device_mismatch" }
> {
  const tokenHash = hashRefreshToken(input.rawRefreshToken);

  const existing = await prisma.mobileRefreshToken.findUnique({
    where: { tokenHash },
    include: { device: true },
  });

  if (!existing) return { ok: false, reason: "invalid" };
  if (existing.revokedAt) return { ok: false, reason: "revoked" };
  if (existing.expiresAt <= new Date()) return { ok: false, reason: "expired" };
  if (existing.device.deviceId !== input.deviceId) return { ok: false, reason: "device_mismatch" };

  const next = await mintRefreshToken(prisma, {
    userId: existing.userId,
    mobileDeviceId: existing.mobileDeviceId,
    userAgent: input.userAgent,
    ipAddress: input.ipAddress,
  });

  await prisma.mobileRefreshToken.update({
    where: { id: existing.id },
    data: {
      revokedAt: new Date(),
      replacedById: next.refreshTokenRecordId,
    },
  });

  return {
    ok: true,
    userId: existing.userId,
    mobileDeviceId: existing.mobileDeviceId,
    refreshToken: next.refreshToken,
    expiresAt: next.expiresAt,
  };
}

export async function revokeRefreshToken(
  prisma: MobileAuthDb,
  input: { rawRefreshToken: string; deviceId: string }
): Promise<boolean> {
  const tokenHash = hashRefreshToken(input.rawRefreshToken);

  const existing = await prisma.mobileRefreshToken.findUnique({
    where: { tokenHash },
    include: { device: true },
  });

  if (!existing) return false;
  if (existing.device.deviceId !== input.deviceId) return false;

  if (existing.revokedAt) return true;

  await prisma.mobileRefreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  return true;
}

export async function revokeAllRefreshTokensForUser(prisma: MobileAuthDb, userId: string): Promise<number> {
  const res = await prisma.mobileRefreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return res.count;
}
