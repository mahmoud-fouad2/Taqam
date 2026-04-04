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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const attempts = Number(process.env.DB_BOOTSTRAP_ATTEMPTS || 10);
  const delayMs = Number(process.env.DB_BOOTSTRAP_DELAY_MS || 3000);
  const schemaSyncMode = process.env.PRISMA_SCHEMA_SYNC_MODE === "push" ? "push" : "migrate";
  const bootstrapEnabled = process.env.ENABLE_SUPER_ADMIN_BOOTSTRAP === "true";

  console.log(`[render-start] Starting (attempts=${attempts}, delayMs=${delayMs}, schemaSyncMode=${schemaSyncMode})`);

  // 1) Sync schema using safe migrations by default. Explicitly opt into db push only when needed.
  let pushed = false;
  for (let i = 1; i <= attempts; i++) {
    const args = schemaSyncMode === "push"
      ? ["db", "push", "--accept-data-loss"]
      : ["migrate", "deploy"];
    console.log(`[render-start] prisma ${args.join(" ")} (attempt ${i}/${attempts})`);
    const r = await run(bin("prisma"), args, { label: schemaSyncMode === "push" ? "db-push" : "migrate-deploy" });
    if (r.code === 0) {
      pushed = true;
      break;
    }
    if (i < attempts) {
      console.log(`[render-start] schema sync failed; retrying in ${delayMs}ms...`);
      await sleep(delayMs);
    }
  }

  if (!pushed) {
    console.error("[render-start] prisma schema sync failed after retries; exiting.");
    process.exit(1);
  }

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
