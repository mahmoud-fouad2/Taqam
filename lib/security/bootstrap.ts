export function isSuperAdminBootstrapEnabled() {
  return process.env.ENABLE_SUPER_ADMIN_BOOTSTRAP === "true";
}

export function hasValidSuperAdminBootstrapToken(headers: Headers) {
  const configuredToken = process.env.SUPER_ADMIN_BOOTSTRAP_TOKEN;
  if (!configuredToken) {
    return false;
  }

  return headers.get("x-bootstrap-token") === configuredToken;
}