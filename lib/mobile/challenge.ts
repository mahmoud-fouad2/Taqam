import crypto from "crypto";
import type prisma from "@/lib/db";

type MobileChallengeDb = Pick<typeof prisma, "mobileChallenge">;

const DEFAULT_TTL_SECONDS = 120;

export function issueNonce(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export function getChallengeExpiryDate(now = new Date()): Date {
  const ttlSeconds = Number(process.env.MOBILE_CHALLENGE_TTL_SECONDS ?? "");
  const seconds = Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : DEFAULT_TTL_SECONDS;
  return new Date(now.getTime() + seconds * 1000);
}

export async function createChallenge(
  prisma: MobileChallengeDb,
  input: { userId: string; mobileDeviceId: string }
): Promise<{ nonce: string; expiresAt: Date }> {
  const nonce = issueNonce();
  const expiresAt = getChallengeExpiryDate();

  await prisma.mobileChallenge.create({
    data: {
      userId: input.userId,
      mobileDeviceId: input.mobileDeviceId,
      nonce,
      expiresAt
    }
  });

  return { nonce, expiresAt };
}

export async function consumeChallenge(
  prisma: MobileChallengeDb,
  input: { nonce: string; userId: string; mobileDeviceId: string }
): Promise<boolean> {
  const challenge = await prisma.mobileChallenge.findUnique({
    where: { nonce: input.nonce }
  });

  if (!challenge) return false;
  if (challenge.userId !== input.userId) return false;
  if (challenge.mobileDeviceId !== input.mobileDeviceId) return false;
  if (challenge.usedAt) return false;
  if (challenge.expiresAt <= new Date()) return false;

  await prisma.mobileChallenge.update({
    where: { id: challenge.id },
    data: { usedAt: new Date() }
  });

  return true;
}
