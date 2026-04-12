import { timingSafeEqual } from "node:crypto";

export function isSuperAdminBootstrapEnabled() {
  return process.env.ENABLE_SUPER_ADMIN_BOOTSTRAP === "true";
}

export function hasValidSuperAdminBootstrapToken(headers: Headers) {
  const configuredToken = process.env.SUPER_ADMIN_BOOTSTRAP_TOKEN;
  if (!configuredToken) {
    return false;
  }

  const providedToken = headers.get("x-bootstrap-token");
  if (!providedToken) {
    return false;
  }

  const configuredBuffer = Buffer.from(configuredToken, "utf8");
  const providedBuffer = Buffer.from(providedToken, "utf8");

  if (configuredBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(configuredBuffer, providedBuffer);
}