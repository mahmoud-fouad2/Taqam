import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const runnerPath = fileURLToPath(new URL("./run-next-build.mjs", import.meta.url));

const env = {
  ...process.env,
  ANALYZE: "true"
};

const child = spawn(process.execPath, [runnerPath, "--webpack"], {
  stdio: "inherit",
  env
});

child.on("error", (error) => {
  console.error("[analyze] Failed to start Next.js analyze build.", error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`[analyze] Build terminated by signal ${signal}.`);
    process.exit(1);
  }

  process.exit(code ?? 1);
});
