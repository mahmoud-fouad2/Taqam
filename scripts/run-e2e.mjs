#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const readinessUrl = `${baseUrl}/api/health`;
const isWindows = process.platform === "win32";

const sharedEnv = {
  ...process.env,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "playwright-local-secret",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || baseUrl,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || baseUrl,
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY:
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "playwright-site-key",
  MOBILE_JWT_SECRET: process.env.MOBILE_JWT_SECRET || "playwright-mobile-jwt-secret",
  MOBILE_REFRESH_TOKEN_SECRET:
    process.env.MOBILE_REFRESH_TOKEN_SECRET || "playwright-mobile-refresh-secret",
  PLAYWRIGHT_BASE_URL: baseUrl
};

function killProcessTree(pid) {
  if (!pid) return;

  if (isWindows) {
    spawnSync("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }

  process.kill(-pid, "SIGTERM");
}

async function waitForServer(url, timeoutMs = 180_000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: "manual" });

      if (response.status >= 200 && response.status < 400) {
        return;
      }
    } catch {
      // Ignore startup errors until timeout.
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function main() {
  const serverProcess = spawn("pnpm exec next dev --webpack --hostname localhost --port 3000", [], {
    env: sharedEnv,
    stdio: "inherit",
    detached: !isWindows,
    shell: true
  });

  try {
    await waitForServer(readinessUrl);

    const testProcess = spawn("pnpm exec playwright test", [], {
      env: sharedEnv,
      stdio: "inherit",
      shell: true
    });

    const exitCode = await new Promise((resolve, reject) => {
      testProcess.on("exit", resolve);
      testProcess.on("error", reject);
    });

    if (exitCode !== 0) {
      process.exit(exitCode ?? 1);
    }
  } finally {
    killProcessTree(serverProcess.pid);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
