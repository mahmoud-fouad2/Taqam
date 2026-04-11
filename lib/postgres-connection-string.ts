const LEGACY_SSL_MODES = new Set(["prefer", "require", "verify-ca"]);

export function normalizePostgresConnectionString(connectionString: string): string {
  try {
    const parsed = new URL(connectionString);
    const sslMode = parsed.searchParams.get("sslmode")?.toLowerCase();

    if (!sslMode || !LEGACY_SSL_MODES.has(sslMode)) {
      return connectionString;
    }

    if (parsed.searchParams.get("uselibpqcompat") === "true") {
      return connectionString;
    }

    parsed.searchParams.set("sslmode", "verify-full");
    return parsed.toString();
  } catch {
    return connectionString;
  }
}
