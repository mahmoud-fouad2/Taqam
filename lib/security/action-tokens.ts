import { jwtVerify, SignJWT, type JWTPayload } from "jose";

export type ActionTokenType = "password-reset" | "tenant-admin-activation";

export type ActionTokenPayload = {
  type: ActionTokenType;
  userId: string;
  email: string;
  tenantId?: string | null;
  passwordChangedAt?: string | null;
};

function getTokenSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required to issue action tokens");
  }
  return new TextEncoder().encode(secret);
}

export async function createActionToken(
  payload: ActionTokenPayload,
  expiresIn: string | number = "2h"
) {
  return await new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getTokenSecret());
}

export async function verifyActionToken(token: string): Promise<ActionTokenPayload> {
  const { payload } = await jwtVerify(token, getTokenSecret());

  const type = payload.type;
  const userId = payload.userId;
  const email = payload.email;

  if (
    (type !== "password-reset" && type !== "tenant-admin-activation") ||
    typeof userId !== "string" ||
    typeof email !== "string"
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    type,
    userId,
    email,
    tenantId: typeof payload.tenantId === "string" ? payload.tenantId : null,
    passwordChangedAt:
      typeof payload.passwordChangedAt === "string" ? payload.passwordChangedAt : null,
  };
}