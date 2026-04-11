import { spawn } from "node:child_process";

function bin(name) {
  // Use local binaries from node_modules/.bin
  const isWin = process.platform === "win32";
  const ext = isWin ? ".cmd" : "";
  return `node_modules/.bin/${name}${ext}`;
}

function run(cmd, args, { label, env } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: "inherit", env: env ?? process.env });
    child.on("close", (code) => resolve({ code: code ?? 1, label }));
  });
}

async function main() {
  const bootstrapEnabled = process.env.ENABLE_SUPER_ADMIN_BOOTSTRAP === "true";
  const skipStartupMigrations = process.env.SKIP_STARTUP_MIGRATIONS === "true";

  if (skipStartupMigrations) {
    console.log("[render-start] startup migrations disabled; relying on preDeployCommand.");
  } else {
    console.log("[render-start] Running prisma migrate deploy as a startup safety net...");
    const migrate = await run(bin("prisma"), ["migrate", "deploy"], {
      label: "prisma-migrate-deploy"
    });
    if (migrate.code !== 0) {
      // Do NOT exit — a transient DB unreachability (e.g. Neon cold start, network blip)
      // must not create a crash loop. The app itself handles DB errors gracefully per-request.
      console.error(
        "[render-start] prisma migrate deploy failed (exit code " +
          migrate.code +
          "); starting app anyway. Check DB connectivity if this persists."
      );
    }
  }

  // 2) Ensure bootstrap super admin.
  if (bootstrapEnabled) {
    const ensure = await run("node", ["scripts/ensure-super-admin.mjs"], {
      label: "ensure-super-admin"
    });
    if (ensure.code !== 0) {
      console.error("[render-start] ensure-super-admin failed; continuing to start app anyway.");
    }
  } else {
    console.log("[render-start] super admin bootstrap disabled; skipping ensure-super-admin.");
  }

  // 3) Start Next.
  // Always use `next start` — never standalone server.js. Standalone mode on
  // Render requires manually copying .next/static, public, and native binaries
  // into .next/standalone, which is fragile and has caused persistent 404s.
  // `next start` serves everything correctly from the .next directory directly.
  console.log("[render-start] Starting Next.js via next start...");

  // Force HOSTNAME=0.0.0.0 so Next binds on all interfaces.
  // Render sets HOSTNAME to the pod's internal hostname; inheriting it makes
  // the process unreachable from Render's load balancer.
  const nextEnv = {
    ...process.env,
    HOSTNAME: "0.0.0.0",
    // Help Next.js locate sharp for image optimization in non-standalone mode.
    ...(!process.env.NEXT_SHARP_PATH
      ? { NEXT_SHARP_PATH: "/opt/render/project/src/node_modules/sharp" }
      : {})
  };

  const next = await run(bin("next"), ["start", "--hostname", "0.0.0.0"], {
    label: "next-start",
    env: nextEnv
  });
  process.exit(next.code);
}

main().catch((e) => {
  console.error("[render-start] fatal:", e);
  process.exit(1);
});
