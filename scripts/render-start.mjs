import { spawn } from "node:child_process";

function bin(name) {
  // Use local binaries from node_modules/.bin
  const isWin = process.platform === "win32";
  const ext = isWin ? ".cmd" : "";
  return `node_modules/.bin/${name}${ext}`;
}

function run(cmd, args, { label } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: "inherit" });
    child.on("close", (code) => resolve({ code: code ?? 1, label }));
  });
}

async function main() {
  const bootstrapEnabled = process.env.ENABLE_SUPER_ADMIN_BOOTSTRAP === "true";

  // Migrations run in preDeployCommand on Render before this script starts.
  // Skipping duplicate migrate here to save memory and startup time.
  console.log("[render-start] schema migrations handled by preDeployCommand; skipping.");

  // 2) Ensure bootstrap super admin.
  if (bootstrapEnabled) {
    const ensure = await run("node", ["scripts/ensure-super-admin.mjs"], { label: "ensure-super-admin" });
    if (ensure.code !== 0) {
      console.error("[render-start] ensure-super-admin failed; continuing to start app anyway.");
    }
  } else {
    console.log("[render-start] super admin bootstrap disabled; skipping ensure-super-admin.");
  }

  // 3) Start Next.
  console.log("[render-start] Starting Next.js...");
  const next = await run(bin("next"), ["start"], { label: "next-start" });
  process.exit(next.code);
}

main().catch((e) => {
  console.error("[render-start] fatal:", e);
  process.exit(1);
});
